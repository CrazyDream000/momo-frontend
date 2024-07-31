'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
export const features = [
    {
        name: "Staking",
        path: "/staking",
        icons: "/images/icon/staking-icons.svg"
    },
    {
        name: "Farming",
        path: "/farming",
        icons: "/images/icon/farming-icons.svg"
    },
    {
        name: "Launchpad",
        path: "/launchpad",
        icons: "/images/icon/launchpad-icons.svg"
    },
    {
        name: "Dex",
        path: "/dex",
        icons: "/images/icon/dex-icons.svg"
    },
];

export const Features = () => {
    const pathname = usePathname()

    return (
        <div className="flex ">
            {features.map((e) =>
            (
                <a href={e.path} key={e.name} className="px-[20px] mx-auto flex text-gray-400 hover:text-white">
                    <img src={e.icons}></img>
                    <div className={`${e.path === pathname ? 'text-[#1ED760]' : ''}`}>&nbsp;{e.name}</div>
                </a>
            ))

            }
        </div>
    );
};
