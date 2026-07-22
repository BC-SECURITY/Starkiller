import normalComputer from "../assets/graph-view/computer.png";
import hackedComputer from "../assets/graph-view/hacked.png";
import empireLogo from "../assets/graph-view/empire.png";
import unknownLogo from "../assets/graph-view/unknown.png";
import linuxLogo from "../assets/graph-view/linux.png";
import macLogo from "../assets/graph-view/macosx.png";
import windows2000Logo from "../assets/graph-view/windows2000.png";
import windowsXPLogo from "../assets/graph-view/windowsxp.png";
import windows7Logo from "../assets/graph-view/windows7.png";
import windows8Logo from "../assets/graph-view/windows8.png";
import windows10Logo from "../assets/graph-view/windows10.png";
import windows11Logo from "../assets/graph-view/windows11.png";

const osLogoMap = [
  { match: "linux", logo: linuxLogo },
  { match: "darwin", logo: macLogo },
  { match: "windows 7", logo: windows7Logo },
  { match: "windows 8", logo: windows8Logo },
  { match: "windows 10", logo: windows10Logo },
  { match: "windows 11", logo: windows11Logo },
  { match: "windows xp", logo: windowsXPLogo },
  { match: "windows 2000", logo: windows2000Logo },
  { match: "windows server", logo: windows2000Logo },
  { match: "windows", logo: windows10Logo },
];

function getOsLogo(payload) {
  if (payload?.listener) return empireLogo;

  const os = payload?.os?.toLowerCase() ?? "";
  const entry = osLogoMap.find((e) => os.includes(e.match));
  return entry ? entry.logo : unknownLogo;
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shapeBuilder(data, TemplateAPI) {
  const { SVGShape } = TemplateAPI;

  const computer = data.payload?.hacked ? hackedComputer : normalComputer;
  const logo = getOsLogo(data.payload);
  const title = escapeXml(data.payload?.title ?? "");

  const shapeText = `
    <image x="0" y="0" width="333" height="259" href="${logo}" />
    <image x="0" y="0" width="333" height="259" href="${computer}" />
    <text style="font-size: 3em" text-anchor="middle" x="166" y="290">${title}</text>
    `;

  return SVGShape(shapeText);
}

export default {
  shapeSize: 120,
  shapeBuilder,
};
