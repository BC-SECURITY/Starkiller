/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */

import firewall from "../assets/graph-view/firewall.png";

export default {
  shapeSize: 120,
  shapeBuilder,
};

function shapeBuilder(data, TemplateAPI) {
  const { ShapeStyle, SVGShape, TextCollection, CollectionStyle } = TemplateAPI;

  const shape = SVGShape(`
  <image x="0" y="0" width="333" height="259" href="${firewall}" />
  `);

  return shape;
}
