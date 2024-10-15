// "use client";

// import { Suspense, useEffect, useState, type ReactNode } from "react";
// import dynamic from "next/dynamic";

// export function getWindow(): (Window & typeof globalThis) | null {
//   return typeof window !== "undefined" ? window : null;
// }

// const webGLCtxNames = ["webgl2", "webgl", "experimental-webgl"];
// export function hasWebGLContext(): boolean {
//   const window = getWindow();
//   if (!window) return false;

//   const canvas = window?.document.createElement("canvas");
//   if (!canvas) return false;

//   const { WebGLRenderingContext, WebGL2RenderingContext } = window;
//   if (WebGLRenderingContext == null) return false;

//   return webGLCtxNames
//     .map((ctxName) => {
//       try {
//         return canvas.getContext(ctxName);
//       } catch {
//         return null;
//       }
//     })
//     .some(
//       (ctx) =>
//         ctx != null &&
//         (ctx instanceof WebGLRenderingContext ||
//           (WebGL2RenderingContext !== null &&
//             ctx instanceof WebGL2RenderingContext)) &&
//         ctx.getParameter(ctx.VERSION) !== null,
//     );
// }

// const FADE = {
//   start: 300, // start fading out at 100px
//   end: 1300, // end fading out at 300px
// };

// const Space = dynamic(() => import("@/components/Space"), { ssr: false });

// export function Background() {
//   const [opacity, setOpacity] = useState(0.6);
//   const [isWindowResizing, setIsWindowResizing] = useState(false);
//   const [canUseWebGL, setCanUseWebGL] = useState(hasWebGLContext());
//   const [inner, setInner] = useState<ReactNode>(null);

//   useEffect(() => {
//     const handleScroll = () => {
//       const currentScrollY = window.scrollY;

//       if (currentScrollY <= FADE.start) {
//         setOpacity(0.6);
//       } else if (currentScrollY <= FADE.end) {
//         const range = FADE.end - FADE.start;
//         const diff = currentScrollY - FADE.start;
//         const ratio = diff / range;
//         setOpacity(0.6 - ratio);
//       } else {
//         setOpacity(0);
//       }
//     };
//     window.addEventListener("scroll", handleScroll);

//     return () => {
//       window.removeEventListener("scroll", handleScroll);
//     };
//   }, []);

//   useEffect(() => {
//     let resizeTimer: ReturnType<typeof setTimeout>;
//     const handleResize = () => {
//       setIsWindowResizing(true);
//       clearTimeout(resizeTimer);
//       resizeTimer = setTimeout(() => {
//         setIsWindowResizing(false);
//       }, 100);
//     };
//     window.addEventListener("resize", handleResize);
//     return () => {
//       window.removeEventListener("resize", handleResize);
//       clearTimeout(resizeTimer);
//     };
//   }, []);

//   useEffect(() => {
//     setInner(
//       canUseWebGL ? (
//         <Space onRenderFail={() => setCanUseWebGL(false)} />
//       ) : undefined,
//     );
//   }, [canUseWebGL]);

//   return (
//     <div style={{ opacity }}>
//       <Suspense>{!isWindowResizing && inner}</Suspense>
//     </div>
//   );
// }
