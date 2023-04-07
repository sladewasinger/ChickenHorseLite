import { CustomBody } from "@/models/CustomBody";

export interface Level {
    name: string;
    getBodies(): CustomBody[];
}
