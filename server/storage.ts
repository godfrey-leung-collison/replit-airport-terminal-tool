import type { Airport, CustomPoi, DrawnPolygon, InsertCustomPoi, InsertDrawnPolygon } from "@shared/schema";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

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
    
    // this.seedAirports();
    this.seedAirportsFromCSV();
  }

  private seedAirportsFromCSV() {
    try {
      // Read the CSV file
      const csvPath = join(process.cwd(), 'files', 'iata-icao.csv');
      const csvContent = readFileSync(csvPath, 'utf-8');
      
      // Parse CSV manually (simple approach for this format)
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      // Find column indices
      const countryCodeIdx = headers.indexOf('country_code');
      const regionIdx = headers.indexOf('region_name');
      const iataIdx = headers.indexOf('iata');
      const airportIdx = headers.indexOf('airport');
      const latIdx = headers.indexOf('latitude');
      const lonIdx = headers.indexOf('longitude');
      
      // Parse each line (skip header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line handling quoted values
        const values = this.parseCSVLine(line);
        if (values.length < headers.length) continue;
        
        const iataCode = values[iataIdx];
        // Skip entries without IATA code
        if (!iataCode || iataCode === '') continue;
        
        const airport: Airport = {
          id: randomUUID(),
          iataCode: iataCode,
          name: values[airportIdx],
          city: values[regionIdx],
          country: values[countryCodeIdx], // Using country code; you could map to full names if needed
          latitude: parseFloat(values[latIdx]),
          longitude: parseFloat(values[lonIdx]),
        };
        
        this.airports.set(airport.id, airport);
      }
      
      console.log(`Loaded ${this.airports.size} airports from CSV`);
    } catch (error) {
      console.error('Error loading airports from CSV:', error);
      // Fallback to hardcoded airports if CSV loading fails
      this.seedAirportsHardcoded();
    }
  }
  
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  }

  private seedAirportsHardcoded() {
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
      airportIataCode: insertPoi.airportIataCode ?? null,
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
      airportIataCode: insertPolygon.airportIataCode ?? null,
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
