"use client";
import dynamic from "next/dynamic";

const OceanProfile3D = dynamic(() => import("./OceanProfile3D"), { ssr: false });
export default OceanProfile3D;
