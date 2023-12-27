import type { ItemT } from "@crud:virtual-module-placeholder/base";
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<__VLS_TypePropsToRuntimeProps<{
    fullpageEditor?: boolean | "true" | "false";
}>, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<__VLS_TypePropsToRuntimeProps<{
    fullpageEditor?: boolean | "true" | "false";
}>>>, {}, {}>, {
    controlButtons?(_: {}): any;
    createButton?(_: {}): any;
    deleteButton?(_: {}): any;
    closeButton?(_: {}): any;
    container?(_: {}): any;
    default?(_: {
        item: ItemT;
        key: string;
    }): any;
    editorPlaceholder?(_: {}): any;
    filters?(_: {}): any;
    pager?(_: {}): any;
    listHeader?(_: {}): any;
    list?(_: {}): any;
    listItem?(_: {
        item: ItemT;
    }): any;
    listItemName?(_: {
        item: ItemT;
    }): any;
    listItemNamePrefix?(_: {
        item: ItemT;
    }): any;
    listItemNameLink?(_: {
        item: ItemT;
    }): any;
    listItemNameText?(_: {
        item: ItemT;
    }): any;
    listItemNameSuffix?(_: {
        item: ItemT;
    }): any;
    listItemId?(_: {
        item: ItemT;
    }): any;
    listItemIdLink?(_: {
        item: ItemT;
    }): any;
    listItemIdText?(_: {
        item: ItemT;
    }): any;
    listFooter?(_: {}): any;
    editor?(_: {
        item: ItemT;
        key: string;
    }): any;
    overlay?(_: {}): any;
}>;
export default _default;
type __VLS_NonUndefinedable<T> = T extends undefined ? never : T;
type __VLS_TypePropsToRuntimeProps<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? {
        type: import('vue').PropType<__VLS_NonUndefinedable<T[K]>>;
    } : {
        type: import('vue').PropType<T[K]>;
        required: true;
    };
};
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
