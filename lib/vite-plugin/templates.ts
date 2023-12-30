
import type { Templates } from "./@types";

import apiTpl from "./templates/client/_api.ts.tpl";
import baseTpl from "./templates/client/_base.ts.tpl";

import ControlButtonsTpl from "./templates/client/_ControlButtons.vue.tpl";
import ControlButtonsDtsTpl from "./templates/client/_ControlButtons.vue.d.ts.tpl";

import CreateDialogTpl from "./templates/client/_CreateDialog.vue.tpl";
import CreateDialogDtsTpl from "./templates/client/_CreateDialog.vue.d.ts.tpl";

import EditorPlaceholderTpl from "./templates/client/_EditorPlaceholder.vue.tpl";
import EditorPlaceholderDtsTpl from "./templates/client/_EditorPlaceholder.vue.d.ts.tpl";

import handlersTpl from "./templates/client/_handlers.ts.tpl";
import indexTpl from "./templates/client/_index.ts.tpl";

import LayoutTpl from "./templates/client/_Layout.vue.tpl";
import LayoutDtsTpl from "./templates/client/_Layout.vue.d.ts.tpl";

import OverlayTpl from "./templates/client/_Overlay.vue.tpl";
import OverlayDtsTpl from "./templates/client/_Overlay.vue.d.ts.tpl";

import PagerTpl from "./templates/client/_Pager.vue.tpl";
import PagerDtsTpl from "./templates/client/_Pager.vue.d.ts.tpl";

import setupTpl from "./templates/client/_setup.ts.tpl";
import storeTpl from "./templates/client/_store.ts.tpl";

import assetsTpl from "./templates/client/assets.tpl";
import apiTypesTpl from "./templates/client/apiTypes.tpl";
import moduleDtsTpl from "./templates/client/moduleDts.tpl";

import apiFactoryTpl from "./templates/api/_factory.tpl";
import apiConstructorsTpl from "./templates/api/_constructors.tpl";

export const clientTemplatesFactory = (): Required<Templates> & { moduleDts: string } => ({

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

  moduleDts: moduleDtsTpl,

})

export const apiTemplatesFactory = () => ({
  factory: apiFactoryTpl,
  constructors: apiConstructorsTpl,
})

