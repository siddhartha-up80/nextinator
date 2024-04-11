import { createNoteSchema, CreateNoteSchema } from "@/lib/validation/note";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import LoadingButton from "./loadingbutton";
import { useRouter } from "next/navigation";

interface AddnotedialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Addnotedialog = ({ open, setOpen }: AddnotedialogProps) => {
  const router = useRouter();

  const form = useForm<CreateNoteSchema>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  async function onSubmit(input: CreateNoteSchema) {
    console.log(JSON.stringify(input));
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        body: JSON.stringify(input),
      });

      if (!response.ok) throw Error("Status Code: " + response.status);
      form.reset();
      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong, Please try again later!");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Data</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Add title for your data" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add your data here" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <LoadingButton
                type="submit"
                loading={form.formState.isSubmitting}
                className="w-full"
              >
                Submit
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default Addnotedialog;
