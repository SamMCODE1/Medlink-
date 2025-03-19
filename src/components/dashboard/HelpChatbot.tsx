import { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HelpCircle, Send, Bot } from "lucide-react";

type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
};

const predefinedResponses: Record<string, string> = {
  bed: "Beds can be managed in the Bed Management tab. You can view bed status, assign patients, and mark beds as available, occupied, reserved, or cleaning.",
  patient:
    "Patient information can be found in the Patient Queue tab. You can add patients to the queue, update their status, and view their details.",
  equipment:
    "Equipment can be managed in the Resource Allocation tab. You can view equipment status, assign equipment to departments, and update maintenance status.",
  staff:
    "Staff information is available in the Resource Allocation tab. You can view staff assignments, contact information, and assign staff to departments.",
  department:
    "Departments are organizational units within the hospital. You can view and manage departments in the Resource Allocation tab.",
  login:
    "To log in, use your hospital credentials on the login page. If you're having trouble, please contact your system administrator.",
  password:
    "To reset your password, click on 'Forgot Password' on the login page. You'll receive an email with instructions to reset your password.",
  help: "I'm here to help! You can ask me about beds, patients, equipment, staff, departments, or any other hospital resource management questions.",
  contact:
    "You can contact your colleagues by viewing their information in the Team section. Click on a staff member to see their contact details.",
  emergency:
    "For emergencies, please follow the hospital's emergency protocol. Contact the emergency department immediately.",
  schedule:
    "You can view your schedule in the Calendar section. Click on a date to see your assignments and appointments.",
  notification:
    "Notifications appear in the top right corner of the dashboard. Click on the bell icon to view all notifications.",
  report:
    "Reports can be generated from the Reports section. You can create reports for bed occupancy, patient wait times, and resource utilization.",
  maintenance:
    "Equipment maintenance can be scheduled in the Resource Allocation tab. Mark equipment as 'maintenance' to indicate it's unavailable.",
  queue:
    "The patient queue shows all patients waiting for service. You can manage the queue in the Patient Queue tab.",
};

export default function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm MediLink Assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Generate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  const generateResponse = (query: string): string => {
    const lowercaseQuery = query.toLowerCase();

    // Check for keyword matches
    for (const [keyword, response] of Object.entries(predefinedResponses)) {
      if (lowercaseQuery.includes(keyword)) {
        return response;
      }
    }

    // Default responses
    if (lowercaseQuery.includes("thank")) {
      return "You're welcome! Is there anything else I can help you with?";
    }

    if (lowercaseQuery.includes("hello") || lowercaseQuery.includes("hi")) {
      return "Hello! How can I assist you with the hospital resource management system today?";
    }

    return "I'm not sure I understand. Could you try rephrasing your question? You can ask about beds, patients, equipment, staff, or departments.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-10 w-10 fixed bottom-6 right-6 bg-blue-500 text-white hover:bg-blue-600 shadow-lg border-none"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            MediLink Assistant
          </DialogTitle>
          <DialogDescription>
            Ask me anything about the hospital resource management system.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  {message.sender === "bot" && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=MediLink" />
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        ML
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`p-3 rounded-lg ${message.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.sender === "user" && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Type your question here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
