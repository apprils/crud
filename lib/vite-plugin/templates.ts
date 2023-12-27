
import type { Templates } from "./@types";

import apiTpl from "./templates/module/_api.ts.tpl";
import baseTpl from "./templates/module/_base.ts.tpl";

import ControlButtonsTpl from "./templates/module/_ControlButtons.vue.tpl";
import ControlButtonsDtsTpl from "./templates/module/_ControlButtons.vue.d.ts.tpl";

import CreateDialogTpl from "./templates/module/_CreateDialog.vue.tpl";
import CreateDialogDtsTpl from "./templates/module/_CreateDialog.vue.d.ts.tpl";

import EditorPlaceholderTpl from "./templates/module/_EditorPlaceholder.vue.tpl";
import EditorPlaceholderDtsTpl from "./templates/module/_EditorPlaceholder.vue.d.ts.tpl";

import handlersTpl from "./templates/module/_handlers.ts.tpl";
import indexTpl from "./templates/module/_index.ts.tpl";

import LayoutTpl from "./templates/module/_Layout.vue.tpl";
import LayoutDtsTpl from "./templates/module/_Layout.vue.d.ts.tpl";

import OverlayTpl from "./templates/module/_Overlay.vue.tpl";
import OverlayDtsTpl from "./templates/module/_Overlay.vue.d.ts.tpl";

import PagerTpl from "./templates/module/_Pager.vue.tpl";
import PagerDtsTpl from "./templates/module/_Pager.vue.d.ts.tpl";

import setupTpl from "./templates/module/_setup.ts.tpl";
import storeTpl from "./templates/module/_store.ts.tpl";

import assetsTpl from "./templates/module/assets.tpl";
import apiTypesTpl from "./templates/module/apiTypes.tpl";
import moduleTpl from "./templates/module/module.tpl";

import apiBundleTpl from "./templates/api/bundle.tpl";

export const defaultTemplatesFactory = (): Required<Templates> => ({

  "assets.ts": assetsTpl,
  "apiTypes.ts": apiTypesTpl,

  "api.ts": apiTpl,
  "base.ts": baseTpl,

  "ControlButtons.vue": ControlButtonsTpl,
  "ControlButtons.vue.d.ts": ControlButtonsDtsTpl,

  "CreateDialog.vue": CreateDialogTpl,
  "CreateDialog.vue.d.ts": CreateDialogDtsTpl,

  "EditorPlaceholder.vue": EditorPlaceholderTpl,
  "EditorPlaceholder.vue.d.ts": EditorPlaceholderDtsTpl,

  "handlers.ts": handlersTpl,
  "index.ts": indexTpl,

  "Layout.vue": LayoutTpl,
  "Layout.vue.d.ts": LayoutDtsTpl,

  "Overlay.vue": OverlayTpl,
  "Overlay.vue.d.ts": OverlayDtsTpl,

  "Pager.vue": PagerTpl,
  "Pager.vue.d.ts": PagerDtsTpl,

  "setup.ts": setupTpl,
  "store.ts": storeTpl,

})

export const extraTemplatesFactory = () => ({
  module: moduleTpl,
  apiBundle: apiBundleTpl,
})

