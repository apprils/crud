
{{#apiTypes.typeDeclarations}}
{{.}}
{{/apiTypes.typeDeclarations}}

export type EnvT = {{apiTypes.EnvT}}{{^apiTypes.EnvT}}unknown{{/apiTypes.EnvT}};

export type ListAssetsT = {{apiTypes.ListAssetsT}}{{^apiTypes.ListAssetsT}}unknown{{/apiTypes.ListAssetsT}};

export type ItemAssetsT = {{apiTypes.ItemAssetsT}}{{^apiTypes.ItemAssetsT}}unknown{{/apiTypes.ItemAssetsT}};

