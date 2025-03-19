import { useState, useEffect } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarPlus, Clock, Users, Stethoscope, Bed } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";

type EventType = "shift" | "meeting" | "maintenance" | "appointment";

type Event = {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: EventType;
  description?: string;
  participants?: string[];
  location?: string;
};

const eventTypeColors: Record<EventType, string> = {
  shift: "bg-blue-100 text-blue-800 border-blue-300",
  meeting: "bg-purple-100 text-purple-800 border-purple-300",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-300",
  appointment: "bg-green-100 text-green-800 border-green-300",
};

const eventTypeIcons: Record<EventType, React.ReactNode> = {
  shift: <Stethoscope className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  maintenance: <Bed className="h-4 w-4" />,
  appointment: <Clock className="h-4 w-4" />,
};

// Mock data for events
const mockEvents: Event[] = [
  {
    id: "1",
    title: "Morning Shift",
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    startTime: "07:00",
    endTime: "15:00",
    type: "shift",
    location: "Emergency Department",
  },
  {
    id: "2",
    title: "Staff Meeting",
    date: new Date(),
    startTime: "10:00",
    endTime: "11:30",
    type: "meeting",
    description: "Weekly staff meeting to discuss department updates",
    participants: ["Dr. Smith", "Nurse Johnson", "Admin Wilson"],
    location: "Conference Room A",
  },
  {
    id: "3",
    title: "Equipment Maintenance",
    date: new Date(),
    startTime: "14:00",
    endTime: "16:00",
    type: "maintenance",
    description: "Scheduled maintenance for MRI machine",
    location: "Radiology Department",
  },
  {
    id: "4",
    title: "Patient Appointment",
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    startTime: "09:30",
    endTime: "10:00",
    type: "appointment",
    description: "Follow-up appointment with John Doe",
    location: "Examination Room 3",
  },
  {
    id: "5",
    title: "Night Shift",
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    startTime: "23:00",
    endTime: "07:00",
    type: "shift",
    location: "Intensive Care Unit",
  },
];

export default function Calendar() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isViewEventOpen, setIsViewEventOpen] = useState(false);

  // New event form state
  const [newEvent, setNewEvent] = useState<Omit<Event, "id">>({
    title: "",
    date: new Date(),
    startTime: "",
    endTime: "",
    type: "meeting",
    description: "",
    location: "",
  });

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const event: Event = {
      ...newEvent,
      id: Date.now().toString(),
      date: date || new Date(),
    };

    setEvents([...events, event]);
    setIsAddEventOpen(false);
    setNewEvent({
      title: "",
      date: new Date(),
      startTime: "",
      endTime: "",
      type: "meeting",
      description: "",
      location: "",
    });

    toast({
      title: "Event added",
      description: `${event.title} has been added to your calendar`,
    });
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsViewEventOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter((event) => event.id !== id));
    setIsViewEventOpen(false);
    toast({
      title: "Event deleted",
      description: "The event has been removed from your calendar",
    });
  };

  // Get events for the selected date
  const eventsForSelectedDate = date
    ? events.filter((event) => isSameDay(event.date, date))
    : [];

  // Function to render date cell with event indicators
  const renderDateCell = (day: Date) => {
    const eventsOnDay = events.filter((event) => isSameDay(event.date, day));
    return eventsOnDay.length > 0 ? (
      <div className="relative h-full w-full p-2">
        <div className="absolute bottom-1 left-0 right-0 flex justify-center">
          <div className="flex gap-0.5">
            {eventsOnDay.length > 3 ? (
              <Badge variant="outline" className="h-1 w-6 bg-blue-500"></Badge>
            ) : (
              eventsOnDay.map((event, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={`h-1 w-1 rounded-full ${event.type === "shift" ? "bg-blue-500" : event.type === "meeting" ? "bg-purple-500" : event.type === "maintenance" ? "bg-yellow-500" : "bg-green-500"}`}
                ></Badge>
              ))
            )}
          </div>
        </div>
      </div>
    ) : null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Calendar</h2>
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
              <DialogDescription>
                Add a new event to your calendar for{" "}
                {date ? format(date, "MMMM d, yyyy") : "today"}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="eventTitle" className="text-right">
                  Title*
                </Label>
                <Input
                  id="eventTitle"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="eventType" className="text-right">
                  Type*
                </Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value) =>
                    setNewEvent({ ...newEvent, type: value as EventType })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shift">Shift</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="appointment">Appointment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startTime" className="text-right">
                  Start Time*
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, startTime: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endTime" className="text-right">
                  End Time*
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, endTime: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, location: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddEventOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddEvent}>Add Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewEventOpen} onOpenChange={setIsViewEventOpen}>
          <DialogContent>
            {selectedEvent && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {eventTypeIcons[selectedEvent.type]}
                    {selectedEvent.title}
                  </DialogTitle>
                  <DialogDescription>
                    {format(selectedEvent.date, "EEEE, MMMM d, yyyy")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2">
                    <Badge className={eventTypeColors[selectedEvent.type]}>
                      {selectedEvent.type.charAt(0).toUpperCase() +
                        selectedEvent.type.slice(1)}
                    </Badge>
                    <div className="text-sm text-gray-500">
                      {selectedEvent.startTime} - {selectedEvent.endTime}
                    </div>
                  </div>
                  {selectedEvent.location && (
                    <div className="text-sm">
                      <span className="font-medium">Location:</span>{" "}
                      {selectedEvent.location}
                    </div>
                  )}
                  {selectedEvent.description && (
                    <div className="text-sm">
                      <span className="font-medium">Description:</span>{" "}
                      {selectedEvent.description}
                    </div>
                  )}
                  {selectedEvent.participants && (
                    <div className="text-sm">
                      <span className="font-medium">Participants:</span>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {selectedEvent.participants.map((participant, i) => (
                          <li key={i}>{participant}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                  >
                    Delete Event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewEventOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2">
          <Card>
            <CardContent className="p-4">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className="rounded-md border"
                components={{
                  DayContent: ({ day }) => renderDateCell(day),
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {date ? format(date, "MMMM d, yyyy") : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsForSelectedDate.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No events scheduled for this day
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {eventsForSelectedDate
                      .sort((a, b) => {
                        return a.startTime.localeCompare(b.startTime);
                      })
                      .map((event) => (
                        <div
                          key={event.id}
                          className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleViewEvent(event)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {event.startTime} - {event.endTime}
                              </div>
                            </div>
                            <Badge className={eventTypeColors[event.type]}>
                              {event.type.charAt(0).toUpperCase() +
                                event.type.slice(1)}
                            </Badge>
                          </div>
                          {event.location && (
                            <div className="text-xs text-gray-500 mt-2">
                              {event.location}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
