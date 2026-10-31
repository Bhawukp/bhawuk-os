import "./tv-os.css";
import { flags } from "@/config/flags";
import { buildAbout, buildCatalog, buildFeatured, buildGuide } from "@/content/catalog";
import { profile } from "@/content/profile";
import BootScreen from "./BootScreen";
import TvHome from "./TvHome";

export default function TvOsTheme() {
  return (
    <>
      {flags.bootSequence && <BootScreen initials={profile.initials} allow3d={flags.intro3d} />}
      <TvHome
        profile={profile}
        about={buildAbout()}
        rows={buildCatalog({ contactForm: flags.contactForm })}
        featured={flags.attract ? buildFeatured() : [buildAbout()]}
        guide={flags.guide ? buildGuide() : null}
        features={{
          devOverlay: flags.devOverlay,
          previews: flags.previews,
          sound: flags.sound,
          ask: flags.ask,
          contactForm: flags.contactForm,
          webmcp: flags.webmcp,
        }}
      />
    </>
  );
}
