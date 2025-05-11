interface GlandRoute {
  path: string;
  method: string;
  action: (ctx) => void;
  meta: {
    path: string;
    method: string;
  };
}
interface GlandChannel {}
export interface GlandEvents {
  'gland:define:route': GlandRoute;
  [key: `gland:define:channel:${string}:${string}`]: GlandChannel;
}
