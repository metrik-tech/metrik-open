import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TextArea } from "@/components/ui/input";

export function NewBroadcastModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button>Open</button>
      </DialogTrigger>
      <DialogContent className="md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>New Broadcast</DialogTitle>
          <TextArea
            className="h-16 font-mono"
            placeholder="Broadcast message goes here..."
            maxLength={150}
          />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
