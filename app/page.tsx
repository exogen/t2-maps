"use client";
import { useMemo, useState, useDeferredValue, useEffect, useRef } from "react";
import { matchSorter } from "match-sorter";
import { LuRocket } from "react-icons/lu";
import untypedMissionsJson from "./missions.json";
import { useLocationHash } from "./useLocationHash";
import LightBox from "./Lightbox";

const BASE_URL = "/t2-maps/";

type Mission = {
  missionName: string;
  displayName: string;
  missionTypes: string[];
  imageCount: number;
};

const missions = untypedMissionsJson as Record<string, Mission>;
const allMissions = Object.values(missions);

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
    [missionName, displayName, imageCount, missionTypes]
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
  const [hash, setHash] = useLocationHash({ subscribe: false });
  const [imageIndex, setImageIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeMission = useMemo(() => {
    return hash ? { name: hash, index: imageIndex } : null;
  }, [hash, imageIndex]);

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
    setImageIndex(0);
    setHash("");
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
                  onOpen={(index) => {
                    setHash(missionName);
                    setImageIndex(index);
                  }}
                />
              </li>
            );
          }
        )}
      </ul>
      <LightBox
        title={activeMissionData?.displayName ?? activeMissionData?.missionName}
        activeMission={activeMission}
        close={closeLightbox}
        slides={lightboxSlides}
      />
    </main>
  );
}
