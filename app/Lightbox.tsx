import YetAnotherReactLightbox from "yet-another-react-lightbox";
import { LuRocket } from "react-icons/lu";
import "yet-another-react-lightbox/styles.css";
import "./Lightbox.css";

declare module "yet-another-react-lightbox" {
  interface SlideImage {
    displayName: string;
    missionName: string;
  }
}

const animationSettings = {
  swipe: 150,
};

const controllerSettings = {
  closeOnBackdropClick: true,
};

export default function LightBox({ title, activeMission, close, slides }) {
  return (
    <YetAnotherReactLightbox
      open={activeMission != null}
      close={close}
      slides={slides}
      index={activeMission?.index ?? 0}
      animation={animationSettings}
      controller={controllerSettings}
      carousel={{ padding: 64 }}
      toolbar={{
        buttons: [
          title ? (
            <h1 className="LightboxTitle" key="title">
              {title}
            </h1>
          ) : null,
          activeMission ? (
            <a
              key="launchButton"
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
  );
}
