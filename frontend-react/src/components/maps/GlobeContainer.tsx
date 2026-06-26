"use client";
import dynamic from "next/dynamic";
import type { MigrationArc, MigrationPoint } from "./MigrationGlobe";

const MigrationGlobe = dynamic(() => import("./MigrationGlobe"), { ssr: false });

export type { MigrationArc, MigrationPoint };
export default MigrationGlobe;
