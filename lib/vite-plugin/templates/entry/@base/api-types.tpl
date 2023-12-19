{{BANNER}}

{{#apiTypes.typeDeclarations}}
{{.}}
{{/apiTypes.typeDeclarations}}

export type EnvT = {{apiTypes.EnvT}}{{^apiTypes.EnvT}}unknown{{/apiTypes.EnvT}};

export type ItemAssetsT = {{apiTypes.ItemAssetsT}}{{^apiTypes.ItemAssetsT}}unknown{{/apiTypes.ItemAssetsT}};

