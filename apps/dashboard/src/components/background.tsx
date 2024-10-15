import styles from "./background.module.css";

// .main {
//   width: 100vw;
//   min-height: 100vh;
//   position: fixed;
//   display: flex;
//   justify-content: center;
//   padding: 120px 24px 160px 24px;
//   pointer-events: none;
// }

// .main:after {
//   content: "";
//   background-image: url("/static/grid.svg");
//   z-index: 2;
//   position: absolute;
//   width: 100%;
//   height: 100%;
//   top: 0;
//   opacity: 0.4;
//   filter: invert(1);
// }

export function Background() {
  return (
    <div className="pointer-events-none fixed flex h-screen w-screen justify-center px-6 pb-[160px] pt-[120px] after:absolute after:top-0 after:z-[2] after:h-full after:w-full after:bg-[url('/static/grid.svg')] after:opacity-40 after:invert-[1] dark:after:opacity-20 dark:after:invert-0">
      <div className={styles.content} />
    </div>
  );
}
