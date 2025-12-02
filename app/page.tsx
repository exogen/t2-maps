"use client";
import { useMemo, useState, useDeferredValue, useEffect } from "react";
import { matchSorter } from "match-sorter";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import untypedMissionsJson from "./missions.json";

const BASE_URL = "/t2-map-gallery/";

type Mission = {
  missionName: string;
  displayName: string;
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

function getMissionImages(missionName: string, imageCount: number) {
  return Array.from({ length: imageCount }, (_, i) => ({
    src: `${BASE_URL}images/${missionName}.${i + 1}.webp`,
  }));
}

function Mission({
  missionName,
  displayName,
  imageCount,
  onOpen,
}: {
  missionName: string;
  displayName: string;
  imageCount: number;
  onOpen: (index: number) => void;
}) {
  const images = useMemo(
    () => getMissionImages(missionName, imageCount),
    [missionName, imageCount]
  );

  return (
    <section>
      <h3 className="MapName">{displayName}</h3>
      <p className="MapSlug">{missionName}</p>
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
                  width={800}
                  height={600}
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

  const missionList = useMemo(() => {
    if (!deferredFilter.trim()) {
      return allMissions;
    }
    return matchSorter(allMissions, deferredFilter, {
      keys: ["missionName", "displayName"],
    });
  }, [deferredFilter]);

  // Scroll to top when search results change (but not on initial load)
  useEffect(() => {
    if (hasSearched) {
      window.scrollTo(0, 0);
    }
  }, [deferredFilter, hasSearched]);

  const closeLightbox = () => {
    history.replaceState(null, "", location.pathname);
    setActiveMission(null);
  };

  const activeMissionData = activeMission ? missions[activeMission.name] : null;
  const lightboxSlides = activeMissionData
    ? getMissionImages(
        activeMissionData.missionName,
        activeMissionData.imageCount
      )
    : [];

  return (
    <main>
      <header>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            name="filter"
            type="search"
            placeholder={`▸ Search ${missionList.length.toLocaleString()} maps…`}
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
        {missionList.map(({ missionName, displayName, imageCount }) => {
          return (
            <li key={missionName} className="Mission" id={missionName}>
              <Mission
                missionName={missionName}
                displayName={displayName}
                imageCount={imageCount}
                onOpen={(index) =>
                  setActiveMission({ name: missionName, index })
                }
              />
            </li>
          );
        })}
      </ul>
      <Lightbox
        open={activeMission != null}
        close={closeLightbox}
        slides={lightboxSlides}
        index={activeMission?.index ?? 0}
        animation={animationSettings}
        controller={controllerSettings}
      />
    </main>
  );
}
