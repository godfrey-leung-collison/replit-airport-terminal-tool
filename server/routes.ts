import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomPoiSchema, insertDrawnPolygonSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/airports", async (_req, res) => {
    try {
      const airports = await storage.getAllAirports();
      res.json(airports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch airports" });
    }
  });

  app.get("/api/airports/:iataCode", async (req, res) => {
    try {
      const airport = await storage.getAirportByIataCode(req.params.iataCode);
      if (!airport) {
        return res.status(404).json({ error: "Airport not found" });
      }
      res.json(airport);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch airport" });
    }
  });

  app.get("/api/pois/:airportId", async (req, res) => {
    try {
      const airportId = req.params.airportId;
      
      const airport = await storage.getAllAirports().then(airports => 
        airports.find(a => a.id === airportId)
      );
      
      if (!airport) {
        return res.json([]);
      }

      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"~"cafe|restaurant|lounge"](around:2000,${airport.latitude},${airport.longitude});
          node["aeroway"~"gate|terminal"](around:2000,${airport.latitude},${airport.longitude});
          node["tourism"="information"](around:2000,${airport.latitude},${airport.longitude});
        );
        out body;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (!response.ok) {
        return res.json([]);
      }

      const data = await response.json();
      
      const pois = data.elements.map((element: any) => {
        let type = "other";
        
        if (element.tags?.amenity === "cafe") type = "cafe";
        else if (element.tags?.amenity === "restaurant") type = "restaurant";
        else if (element.tags?.amenity === "lounge" || element.tags?.aeroway === "lounge") type = "lounge";
        else if (element.tags?.aeroway === "gate") type = "gate";
        else if (element.tags?.tourism === "information") type = "security";
        
        return {
          id: element.id,
          lat: element.lat,
          lon: element.lon,
          tags: element.tags || {},
          type,
          name: element.tags?.name || `${type} ${element.id}`,
        };
      });

      res.json(pois);
    } catch (error) {
      console.error("Error fetching POIs:", error);
      res.json([]);
    }
  });

  app.get("/api/custom-pois/:airportId", async (req, res) => {
    try {
      const pois = await storage.getCustomPois(req.params.airportId);
      res.json(pois);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch custom POIs" });
    }
  });

  app.post("/api/custom-pois", async (req, res) => {
    try {
      const validated = insertCustomPoiSchema.parse(req.body);
      const poi = await storage.createCustomPoi(validated);
      res.json(poi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create custom POI" });
    }
  });

  app.delete("/api/custom-pois/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCustomPoi(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "POI not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete custom POI" });
    }
  });

  app.get("/api/polygons/:airportId", async (req, res) => {
    try {
      const polygons = await storage.getDrawnPolygons(req.params.airportId);
      res.json(polygons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch polygons" });
    }
  });

  app.post("/api/polygons", async (req, res) => {
    try {
      const validated = insertDrawnPolygonSchema.parse(req.body);
      const polygon = await storage.createDrawnPolygon(validated);
      res.json(polygon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create polygon" });
    }
  });

  app.delete("/api/polygons/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDrawnPolygon(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Polygon not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete polygon" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
