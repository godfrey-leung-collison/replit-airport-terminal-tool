import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DrawnPolygon } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  zoneType: z.string().min(1, "Zone type is required"),
  notes: z.string().optional(),
});

interface PolygonModalProps {
  coordinates: [number, number][];
  airportId: string;
  airportIataCode?: string;
  onSave: (polygon: DrawnPolygon) => void;
  onClose: () => void;
}

export function PolygonModal({
  coordinates,
  airportId,
  airportIataCode,
  onSave,
  onClose,
}: PolygonModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      zoneType: "",
      notes: "",
    },
  });

  const calculateArea = (coords: [number, number][]) => {
    if (coords.length < 3) return 0;
    
    const R = 6371000;
    let area = 0;
    
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      const lat1 = (coords[i][0] * Math.PI) / 180;
      const lat2 = (coords[j][0] * Math.PI) / 180;
      const lon1 = (coords[i][1] * Math.PI) / 180;
      const lon2 = (coords[j][1] * Math.PI) / 180;
      
      area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    
    area = (area * R * R) / 2;
    return Math.abs(area);
  };

  const area = calculateArea(coordinates);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const polygon: DrawnPolygon = {
      id: crypto.randomUUID(),
      airportId,
      airportIataCode: airportIataCode || null,
      name: values.name,
      zoneType: values.zoneType,
      notes: values.notes || null,
      coordinates: coordinates as any,
      area,
      createdAt: new Date(),
    };
    onSave(polygon);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]" data-testid="modal-polygon">
        <DialogHeader>
          <DialogTitle>Define Polygon Area</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Terminal 2 Security Zone"
                      {...field}
                      data-testid="input-polygon-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zoneType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-zone-type">
                        <SelectValue placeholder="Select a zone type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="non-schengen">Non-Schengen Area</SelectItem>
                      <SelectItem value="schengen">Schengen Area</SelectItem>
                      <SelectItem value="concourse">Concourse</SelectItem>
                      <SelectItem value="security">Security Area</SelectItem>
                      <SelectItem value="gates">Gate Area</SelectItem>
                      <SelectItem value="retail">Retail Zone</SelectItem>
                      <SelectItem value="food_court">Food Court</SelectItem>
                      <SelectItem value="lounge_area">Lounge Area</SelectItem>
                      <SelectItem value="baggage">Baggage Area</SelectItem>
                      <SelectItem value="customs">Customs Area</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add additional information..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="input-polygon-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-xs text-muted-foreground space-y-1">
              <div>Points: {coordinates.length}</div>
              <div>Area: {area.toFixed(2)} m²</div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-polygon">
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-polygon">
                Save Area
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
