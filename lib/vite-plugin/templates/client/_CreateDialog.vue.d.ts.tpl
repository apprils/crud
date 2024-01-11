import type { ItemT, ItemI } from "@crud:virtual-module-placeholder/base";
declare function create(): any;
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<{
    modelValue: import("vue").PropType<ItemI>;
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    mounted: () => void;
    created: (item: ItemT) => void;
    close: () => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    modelValue: import("vue").PropType<ItemI>;
}>> & {
    onMounted?: () => any;
    onCreated?: (item: ItemT) => any;
    onClose?: () => any;
}, {}, {}>, {
    header?(_: {
        create: typeof create;
    }): any;
    default?(_: {
        create: typeof create;
    }): any;
    footer?(_: {
        create: typeof create;
    }): any;
}>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
