"use client";
import { useMemo, useState, useDeferredValue, useEffect, useRef } from "react";
import { matchSorter } from "match-sorter";
import { LuRocket } from "react-icons/lu";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

declare module "yet-another-react-lightbox" {
  interface SlideImage {
    displayName: string;
    missionName: string;
  }
}
import untypedMissionsJson from "./missions.json";

const BASE_URL = "/t2-maps/";

type Mission = {
  missionName: string;
  displayName: string;
  missionTypes: string[];
  imageCount: number;
};

const missions = untypedMissionsJson as Record<string, Mission>;
const allMissions = Object.values(missions);

const animationSettings = {
  swipe: 150,
};

const controllerSettings = {
  closeOnBackdropClick: true,
};

const missionTypeNames = {
  arena: "Arena",
  ctf: "CTF",
  sctf: "SCTF",
  teamhunters: "Team Hunters",
};

function getMissionImages({ missionName, displayName, imageCount }: Mission) {
  return Array.from({ length: imageCount }, (_, i) => ({
    src: `${BASE_URL}images/${missionName}.${i + 1}.webp`,
    displayName,
    missionName,
  }));
}

function Mission({
  missionName,
  displayName,
  missionTypes,
  imageCount,
  onOpen,
}: {
  missionName: string;
  displayName: string;
  missionTypes: string[];
  imageCount: number;
  onOpen: (index: number) => void;
}) {
  const images = useMemo(
    () =>
      getMissionImages({ missionName, displayName, imageCount, missionTypes }),
    [missionName, displayName, imageCount]
  );

  return (
    <section>
      <header className="MissionHeader">
        <div className="HeaderBefore"></div>
        <div className="MissionDetails">
          <div className="SubHeading">
            <h3 className="MapName">{displayName || missionName}</h3>
            {missionTypes && missionTypes.length ? (
              <>
                <ul className="MissionTypes">
                  {missionTypes.map((missionType) => (
                    <li className="MissionType" key={missionType}>
                      {missionTypeNames[missionType.toLowerCase()] ??
                        missionType}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <p className="MapSlug">{missionName}</p>
        </div>
        <div className="HeaderAfter">
          <a
            href={`https://exogen.github.io/t2-mapper/?mission=${missionName}`}
            target="_blank"
            title="Launch mission in T2 Map Inspector"
            className="LaunchLink"
          >
            <LuRocket />
          </a>
        </div>
      </header>
      <ul className="ImageList">
        {images.map((image, i) => {
          return (
            <li key={image.src} className="ImageItem">
              <a
                className="ImageLightboxTrigger"
                href={`#${missionName}`}
                onClick={(e) => {
                  e.preventDefault();
                  history.pushState(null, "", `#${missionName}`);
                  onOpen(i);
                }}
              >
                <img
                  className="PreviewImage"
                  src={image.src}
                  alt={`${displayName} map screenshot #${i + 1}`}
                  width={1280}
                  height={720}
                  loading="lazy"
                />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function GalleryPage() {
  const [filter, setFilter] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const deferredFilter = useDeferredValue(filter);
  const [activeMission, setActiveMission] = useState<{
    name: string;
    index: number;
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const missionList = useMemo(() => {
    if (!deferredFilter.trim()) {
      return allMissions;
    }
    return matchSorter(allMissions, deferredFilter, {
      keys: ["missionName", "displayName", "missionTypes"],
    });
  }, [deferredFilter]);

  // Scroll to top when search results change (but not on initial load)
  useEffect(() => {
    if (hasSearched) {
      window.scrollTo(0, 0);
    }
  }, [deferredFilter, hasSearched]);

  // Open lightbox if page is loaded with a #hash matching a mission
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && missions[hash]) {
      setActiveMission({ name: hash, index: 0 });
    }
  }, []);

  // Focus search input on Cmd-K (Mac) or Ctrl-K (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeLightbox = () => {
    history.replaceState(null, "", location.pathname);
    setActiveMission(null);
  };

  const activeMissionData = activeMission ? missions[activeMission.name] : null;
  const lightboxSlides = activeMissionData
    ? getMissionImages(activeMissionData)
    : [];

  return (
    <main>
      <header id="FilterControls">
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            ref={searchInputRef}
            name="filter"
            type="search"
            placeholder={`▸ Search ${allMissions.length.toLocaleString()} maps…`}
            className="TextInput"
            autoFocus
            value={filter}
            onChange={(e) => {
              setHasSearched(true);
              setFilter(e.target.value);
            }}
          />
        </form>
      </header>
      <ul className="MissionList">
        {missionList.map(
          ({ missionName, displayName, imageCount, missionTypes }) => {
            return (
              <li key={missionName} className="Mission" id={missionName}>
                <Mission
                  missionName={missionName}
                  displayName={displayName}
                  missionTypes={missionTypes}
                  imageCount={imageCount}
                  onOpen={(index) =>
                    setActiveMission({ name: missionName, index })
                  }
                />
              </li>
            );
          }
        )}
      </ul>
      <Lightbox
        open={activeMission != null}
        close={closeLightbox}
        slides={lightboxSlides}
        index={activeMission?.index ?? 0}
        animation={animationSettings}
        controller={controllerSettings}
        carousel={{ padding: 64 }}
        toolbar={{
          buttons: [
            activeMission ? (
              <a
                href={`https://exogen.github.io/t2-mapper/?mission=${activeMission.name}`}
                target="_blank"
                title="Launch mission in T2 Map Inspector"
                className="ToolbarLaunchLink"
              >
                <LuRocket />
              </a>
            ) : null,
            "close",
          ],
        }}
        render={{
          slide: ({ slide }) => (
            <div className="LightboxSlide" onClick={(e) => e.stopPropagation()}>
              <figure>
                <img src={slide.src} alt="" />
                <figcaption className="LightboxLabel">
                  {slide.displayName || slide.missionName}
                </figcaption>
              </figure>
            </div>
          ),
        }}
      />
    </main>
  );
}
