"use client";
import dynamic from "next/dynamic";
import type { MarkerPoint } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export type { MarkerPoint };
export default LeafletMap;
