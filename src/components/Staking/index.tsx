"use client";
import { useState } from "react";

import StakingCard from "./StakingCard";

export default function Home() {
  return (
    <div className=" px-5 lg:px-24 h-full min-h-[100vh]  relative w-full bg-[url('/images/back1.png')] bg-opacity-0 bg-cover bg-center">
      <img src="images/blur-ai.png" className="absolute hidden lg:block"></img>
      <div className="py-[200px] lg:flex">
        <StakingCard id={1} apy={100} period={5} />
        <div className="lg:py-0 py-[100px]"></div>
        <StakingCard id={2} apy={200} period={10} />
      </div>
    </div>
  );
}
