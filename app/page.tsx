"use client";
import { useMemo, useState, useDeferredValue, useEffect, useRef } from "react";
import { matchSorter } from "match-sorter";
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
  imageCount,
  onOpen,
}: {
  missionName: string;
  displayName: string;
  imageCount: number;
  onOpen: (index: number) => void;
}) {
  const images = useMemo(
    () => getMissionImages({ missionName, displayName, imageCount }),
    [missionName, displayName, imageCount]
  );

  return (
    <section>
      <h3 className="MapName">{displayName || missionName}</h3>
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
      keys: ["missionName", "displayName"],
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
      <header>
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
        carousel={{ padding: 64 }}
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
