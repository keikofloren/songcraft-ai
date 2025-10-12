import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { supabase } from "../lib/supabase";
import { User, X } from "lucide-react";

interface PatientFormProps {
  onClose: () => void;
  userId: string;
}

export default function PatientForm({ onClose, userId }: PatientFormProps) {
  const handleSubmit = async (
    userId: string,
    firstName: string,
    lastName: string,
    notes: string
  ) => {
    console.log("trying to insert with userId:", userId);
    const { data: result, error } = await supabase
      .from("patients")
      .insert([
        {
          therapist_id: userId,
          first_name: firstName,
          last_name: lastName,
          notes: notes,
        },
      ])
      .select();
    if (error) {
      console.log("error inserting", error);
    } else {
      console.log("Successfully inserted patient:", result);
      onClose();
    }
  };
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [notes, setNotes] = useState("");
  const form = useForm({
    defaultValues: {
      firstName,
      lastName,
      notes,
    },
  });
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg border-[6px] border-amber-950 hover:border-amber-900 bg-white rounded-3xl overflow-hidden shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-amber-950 to-amber-900 border-b-4 border-amber-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg shadow-md">
                <User className="h-5 w-5 text-amber-100" />
              </div>
              <CardTitle className="text-xl text-white">
                Add New Patient
              </CardTitle>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-amber-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <p className="text-sm text-amber-100 mt-2 mb-4 ">
            Enter patient details to add them to your list
          </p>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <Form {...form}>
            <div className="space-y-5">
              <FormItem>
                <FormLabel className="text-amber-950 font-bold">
                  First Name
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border-4 border-amber-950 rounded-2xl focus:border-amber-900 focus:ring-amber-900"
                    placeholder="Enter first name"
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel className="text-amber-950 font-bold">
                  Last Name
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border-4 border-amber-950 rounded-2xl focus:border-amber-900 focus:ring-amber-900"
                    placeholder="Enter last name"
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel className="text-amber-950 font-bold">
                  Notes (Optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border-4 border-amber-950 rounded-2xl focus:border-amber-900 focus:ring-amber-900 min-h-[100px]"
                    placeholder="Add any relevant notes about the patient"
                  />
                </FormControl>
              </FormItem>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={async () => {
                    await handleSubmit(userId, firstName, lastName, notes);
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-950 to-amber-900 hover:from-amber-900 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition-all rounded-2xl border-2 border-amber-950 py-6"
                  disabled={!firstName || !lastName}
                >
                  Add Patient
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-4 border-amber-950 hover:border-amber-900 rounded-2xl hover:bg-amber-100 py-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
