import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Airport data model
export const airports = pgTable("airports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  iataCode: varchar("iata_code", { length: 3 }).notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
});

// Custom POIs added by users
export const customPois = pgTable("custom_pois", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  airportId: varchar("airport_id").notNull(),
  airportIataCode: varchar("airport_iata_code", { length: 3 }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Drawn polygons for terminal areas
export const drawnPolygons = pgTable("drawn_polygons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  airportId: varchar("airport_id").notNull(),
  airportIataCode: varchar("airport_iata_code", { length: 3 }),
  name: text("name").notNull(),
  zoneType: text("zone_type").notNull(),
  notes: text("notes"),
  coordinates: jsonb("coordinates").notNull(), // Array of [lat, lng] pairs
  area: real("area"), // in square meters
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertAirportSchema = createInsertSchema(airports).omit({
  id: true,
});

export const insertCustomPoiSchema = createInsertSchema(customPois).omit({
  id: true,
  createdAt: true,
});

export const insertDrawnPolygonSchema = createInsertSchema(drawnPolygons).omit({
  id: true,
  createdAt: true,
});

// Types
export type Airport = typeof airports.$inferSelect;
export type InsertAirport = z.infer<typeof insertAirportSchema>;

export type CustomPoi = typeof customPois.$inferSelect;
export type InsertCustomPoi = z.infer<typeof insertCustomPoiSchema>;

export type DrawnPolygon = typeof drawnPolygons.$inferSelect;
export type InsertDrawnPolygon = z.infer<typeof insertDrawnPolygonSchema>;

// OpenStreetMap POI from Overpass API
export const osmPoiSchema = z.object({
  id: z.number(),
  lat: z.number(),
  lon: z.number(),
  tags: z.record(z.string(), z.string()),
  type: z.enum(["lounge", "cafe", "restaurant", "security", "gate", "other"]),
  name: z.string().optional(),
});

export type OsmPoi = z.infer<typeof osmPoiSchema>;

// OpenStreetMap Terminal Polygon from Overpass API
export const osmTerminalPolygonSchema = z.object({
  id: z.union([z.number(), z.string()]),
  type: z.enum(["way", "relation"]),
  tags: z.record(z.string(), z.string()),
  name: z.string().optional(),
  geometry: z.array(z.array(z.tuple([z.number(), z.number()]))), // Array of coordinate rings
});

export type OsmTerminalPolygon = z.infer<typeof osmTerminalPolygonSchema>;

// GeoJSON export format
export const featureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      type: z.literal("Feature"),
      properties: z.record(z.string(), z.any()),
      geometry: z.object({
        type: z.enum(["Point", "Polygon"]),
        coordinates: z.union([
          z.tuple([z.number(), z.number()]), // Point
          z.array(z.array(z.tuple([z.number(), z.number()]))), // Polygon
        ]),
      }),
    })
  ),
});

export type FeatureCollection = z.infer<typeof featureCollectionSchema>;
