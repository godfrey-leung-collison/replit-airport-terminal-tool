import type { Airport, CustomPoi, DrawnPolygon, InsertCustomPoi, InsertDrawnPolygon } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getAllAirports(): Promise<Airport[]>;
  getAirportByIataCode(iataCode: string): Promise<Airport | undefined>;
  
  getCustomPois(airportId: string): Promise<CustomPoi[]>;
  createCustomPoi(poi: InsertCustomPoi): Promise<CustomPoi>;
  deleteCustomPoi(id: string): Promise<boolean>;
  
  getDrawnPolygons(airportId: string): Promise<DrawnPolygon[]>;
  createDrawnPolygon(polygon: InsertDrawnPolygon): Promise<DrawnPolygon>;
  deleteDrawnPolygon(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private airports: Map<string, Airport>;
  private customPois: Map<string, CustomPoi>;
  private drawnPolygons: Map<string, DrawnPolygon>;

  constructor() {
    this.airports = new Map();
    this.customPois = new Map();
    this.drawnPolygons = new Map();
    
    this.seedAirports();
  }

  private seedAirports() {
    const sampleAirports: Airport[] = [
      {
        id: randomUUID(),
        iataCode: "JFK",
        name: "John F. Kennedy International Airport",
        city: "New York",
        country: "United States",
        latitude: 40.6413,
        longitude: -73.7781,
      },
      {
        id: randomUUID(),
        iataCode: "LHR",
        name: "London Heathrow Airport",
        city: "London",
        country: "United Kingdom",
        latitude: 51.4700,
        longitude: -0.4543,
      },
      {
        id: randomUUID(),
        iataCode: "HKG",
        name: "Hong Kong International Airport",
        city: "Hong Kong",
        country: "Hong Kong SAR",
        latitude: 22.3080,
        longitude: 113.9185,
      },
      {
        id: randomUUID(),
        iataCode: "DXB",
        name: "Dubai International Airport",
        city: "Dubai",
        country: "United Arab Emirates",
        latitude: 25.2532,
        longitude: 55.3657,
      },
      {
        id: randomUUID(),
        iataCode: "SIN",
        name: "Singapore Changi Airport",
        city: "Singapore",
        country: "Singapore",
        latitude: 1.3644,
        longitude: 103.9915,
      },
      {
        id: randomUUID(),
        iataCode: "LAX",
        name: "Los Angeles International Airport",
        city: "Los Angeles",
        country: "United States",
        latitude: 33.9416,
        longitude: -118.4085,
      },
      {
        id: randomUUID(),
        iataCode: "CDG",
        name: "Charles de Gaulle Airport",
        city: "Paris",
        country: "France",
        latitude: 49.0097,
        longitude: 2.5479,
      },
      {
        id: randomUUID(),
        iataCode: "NRT",
        name: "Narita International Airport",
        city: "Tokyo",
        country: "Japan",
        latitude: 35.7720,
        longitude: 140.3929,
      },
      {
        id: randomUUID(),
        iataCode: "SFO",
        name: "San Francisco International Airport",
        city: "San Francisco",
        country: "United States",
        latitude: 37.6213,
        longitude: -122.3790,
      },
      {
        id: randomUUID(),
        iataCode: "AMS",
        name: "Amsterdam Airport Schiphol",
        city: "Amsterdam",
        country: "Netherlands",
        latitude: 52.3105,
        longitude: 4.7683,
      },
    ];

    sampleAirports.forEach(airport => {
      this.airports.set(airport.id, airport);
    });
  }

  async getAllAirports(): Promise<Airport[]> {
    return Array.from(this.airports.values());
  }

  async getAirportByIataCode(iataCode: string): Promise<Airport | undefined> {
    return Array.from(this.airports.values()).find(
      airport => airport.iataCode.toUpperCase() === iataCode.toUpperCase()
    );
  }

  async getCustomPois(airportId: string): Promise<CustomPoi[]> {
    return Array.from(this.customPois.values()).filter(
      poi => poi.airportId === airportId
    );
  }

  async createCustomPoi(insertPoi: InsertCustomPoi): Promise<CustomPoi> {
    const id = randomUUID();
    const poi: CustomPoi = {
      ...insertPoi,
      description: insertPoi.description ?? null,
      icon: insertPoi.icon ?? null,
      id,
      createdAt: new Date(),
    };
    this.customPois.set(id, poi);
    return poi;
  }

  async deleteCustomPoi(id: string): Promise<boolean> {
    return this.customPois.delete(id);
  }

  async getDrawnPolygons(airportId: string): Promise<DrawnPolygon[]> {
    return Array.from(this.drawnPolygons.values()).filter(
      polygon => polygon.airportId === airportId
    );
  }

  async createDrawnPolygon(insertPolygon: InsertDrawnPolygon): Promise<DrawnPolygon> {
    const id = randomUUID();
    const polygon: DrawnPolygon = {
      ...insertPolygon,
      notes: insertPolygon.notes ?? null,
      area: insertPolygon.area ?? null,
      id,
      createdAt: new Date(),
    };
    this.drawnPolygons.set(id, polygon);
    return polygon;
  }

  async deleteDrawnPolygon(id: string): Promise<boolean> {
    return this.drawnPolygons.delete(id);
  }
}

export const storage = new MemStorage();
