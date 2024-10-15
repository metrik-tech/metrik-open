import Link from "next/link";

export default function Home() {
  return (
    <main className="">
      Metrik Internal Dashboard
      <ul className="mb-2 mt-8 gap-y-1 *:underline">
        <li>
          <Link href="/users">Users</Link>
        </li>
        <li>
          <Link href="/studios">Studios</Link>
        </li>
        <li>
          <Link href="/cdn">CDN</Link>
        </li>
        <li>
          <Link href="/employee-handbook">Employee Handbook</Link>
        </li>
      </ul>
      <p>More pages coming soon, this is a WIP</p>
    </main>
  );
}
