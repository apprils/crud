import type { ItemT, ItemI } from "@crud:virtual-module-placeholder/base";
declare function create(): any;
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<__VLS_TypePropsToRuntimeProps<{
    modelValue: ItemI;
}>, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    mounted: () => void;
    created: (item: ItemT) => void;
    close: () => void;
}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<__VLS_TypePropsToRuntimeProps<{
    modelValue: ItemI;
}>>> & {
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
