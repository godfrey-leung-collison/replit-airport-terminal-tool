import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
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
import type { CustomPoi } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

interface CustomPoiModalProps {
  position: [number, number];
  airportId: string;
  onSave: (poi: CustomPoi) => void;
  onClose: () => void;
}

export function CustomPoiModal({
  position,
  airportId,
  onSave,
  onClose,
}: CustomPoiModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const poi: CustomPoi = {
      id: crypto.randomUUID(),
      airportId,
      name: values.name,
      category: values.category,
      description: values.description || null,
      latitude: position[0],
      longitude: position[1],
      icon: null,
      createdAt: new Date(),
    };
    onSave(poi);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]" data-testid="modal-custom-poi">
        <DialogHeader>
          <DialogTitle>Add Custom POI</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>POI Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Security Checkpoint A"
                      {...field}
                      data-testid="input-poi-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-poi-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="security_checkpoint">Security Checkpoint</SelectItem>
                      <SelectItem value="gate">Gate</SelectItem>
                      <SelectItem value="restroom">Restroom</SelectItem>
                      <SelectItem value="information">Information Desk</SelectItem>
                      <SelectItem value="atm">ATM</SelectItem>
                      <SelectItem value="charging_station">Charging Station</SelectItem>
                      <SelectItem value="baggage_claim">Baggage Claim</SelectItem>
                      <SelectItem value="customs">Customs</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add additional notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="input-poi-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-xs text-muted-foreground font-mono">
              Position: {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-poi">
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-poi">
                Save POI
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
