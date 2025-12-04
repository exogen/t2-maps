import fs from "node:fs/promises";
import puppeteer from "puppeteer";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const missions = {};

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });

const origin = process.env.MAPPER_ORIGIN || "https://exogen.github.io";
const baseUrl = process.env.MAPPER_URL || `${origin}/t2-mapper/`;

await page.evaluateOnNewDocument(() => {
  localStorage.setItem(
    "settings",
    JSON.stringify({
      fov: 90,
      audioEnabled: false,
      animationEnabled: false,
      debugMode: false,
    })
  );
});
await page.goto(baseUrl, { waitUntil: "load" });
await page.waitForNetworkIdle({ idleTime: 2000 });

const outputType = "webp";

const mapViewer = await page.waitForSelector("canvas");
await sleep(100);

// Close the popover by pressing Escape
await page.keyboard.press("Escape");
await sleep(100);

const SCREENSHOT_COUNT = 5;
const CAMERA_KEYS = ["1", "2", "3", "4", "5"] as const;

// Hide controls from screenshots while keeping them selectable
await page.$eval("#controls", (el: HTMLElement) => {
  el.style.visibility = "hidden";
});

// Get mission names from the global getMissionList() function
const missionNames: string[] = await page.evaluate(() =>
  (window as any).getMissionList()
);

for (const missionName of missionNames) {
  // Get mission info from the global getMissionInfo() function
  const { displayName } = await page.evaluate(
    (name) => (window as any).getMissionInfo(name),
    missionName
  );
  // Count existing screenshots
  let existingCount = 0;
  for (let j = 1; j <= SCREENSHOT_COUNT; j++) {
    try {
      await fs.access(`docs/images/${missionName}.${j}.${outputType}`);
      existingCount = j;
    } catch {
      break;
    }
  }
  if (existingCount > 0) {
    missions[missionName] = {
      missionName,
      displayName,
      imageCount: existingCount,
    };
    console.log(
      `Skipping ${missionName} (already exists, ${existingCount} images)`
    );
    continue;
  }

  console.log(`Selecting ${missionName}…`);

  // Use the global setMissionName function to select the mission
  await page.evaluate(
    (name) => (window as any).setMissionName(name),
    missionName
  );
  await page.waitForNetworkIdle({ idleTime: 500 });
  await page.waitForSelector("#loadingIndicator", { hidden: true });
  await sleep(500);

  // Currently, the only way to really know if there are enough cameras to
  // select is to see if the image data in the <canvas> actually changed after
  // trying to select one...
  let previousScreenshot: string | null = null;
  let i = 0;

  for (; i < SCREENSHOT_COUNT; i++) {
    await mapViewer.press(CAMERA_KEYS[i]);
    await page.waitForNetworkIdle({ idleTime: 100 });

    const screenshot = await mapViewer.screenshot({ encoding: "base64" });
    if (screenshot === previousScreenshot) {
      console.log(`View ${i + 1} unchanged, stopping`);
      break;
    }
    previousScreenshot = screenshot;

    const outputPath = `docs/images/${missionName}.${i + 1}.${outputType}`;
    await mapViewer.screenshot({
      path: outputPath,
      type: outputType,
      quality: 90,
    });
    console.log(`Took screenshot #${i + 1}: ${outputPath}`);
  }

  missions[missionName] = { missionName, displayName, imageCount: i };
}

await fs.writeFile("app/missions.json", JSON.stringify(missions), "utf8");

await Promise.race([
  browser.close(),
  sleep(5000).then(() => browser.process()?.kill("SIGKILL")),
]);
