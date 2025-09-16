"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Phone, Loader2, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const demoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"),
  language: z.string().min(1, "Please select a language"),
});

type DemoFormData = z.infer<typeof demoSchema>;

export default function DemoSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DemoFormData>({
    resolver: zodResolver(demoSchema),
  });

  const onSubmit = async (data: DemoFormData) => {
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Format phone number with +1
      const formattedPhone = `+1${data.phone}`;

      console.log("Demo request:", { ...data, phone: formattedPhone });

      setIsSuccess(true);
      toast.success("Demo call scheduled! We'll call you shortly.");

      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="demo" className="py-20 bg-gradient-to-b from-blue-50/30 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Try talking to Verbio AI
            </h2>
            <p className="text-xl text-gray-600">
              Experience the future of voice intelligence with a live demo call
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Demo Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-8 rounded-3xl bg-white shadow-2xl border border-gray-100">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Your Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="mt-1"
                      disabled={isSubmitting || isSuccess}
                      {...register("name")}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">+1</span>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="mt-1 pl-10"
                        disabled={isSubmitting || isSuccess}
                        {...register("phone")}
                        aria-invalid={!!errors.phone}
                        onChange={(e) => {
                          // Remove non-numeric characters
                          const value = e.target.value.replace(/\D/g, "");
                          e.target.value = value.slice(0, 10);
                        }}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="language" className="text-sm font-medium text-gray-700">
                      Preferred Language
                    </Label>
                    <Select
                      disabled={isSubmitting || isSuccess}
                      onValueChange={(value) => setValue("language", value)}
                    >
                      <SelectTrigger className="mt-1" aria-invalid={!!errors.language}>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="german">German</SelectItem>
                        <SelectItem value="mandarin">Mandarin</SelectItem>
                        <SelectItem value="japanese">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.language && (
                      <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-6 text-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Scheduling Call...
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Call Scheduled!
                      </>
                    ) : (
                      <>
                        <Phone className="mr-2 h-5 w-5" />
                        Call Me Now
                      </>
                    )}
                  </Button>
                </form>

                {/* Privacy Note */}
                <div className="mt-6 flex items-start gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Your information is secure and will only be used for this demo.
                    We respect your privacy and won't share your data.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Demo Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  What to expect in your demo call
                </h3>
                <ul className="space-y-4">
                  {[
                    "Natural conversation with our AI voice agent",
                    "Experience real-time response and understanding",
                    "Test various scenarios and questions",
                    "See how it handles interruptions and context",
                    "Learn about integration possibilities",
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-2">
                  No commitment required
                </h4>
                <p className="text-sm text-gray-600">
                  This is a free demo call to show you the capabilities of our AI voice platform.
                  There's no obligation to sign up, and you can ask any questions during the call.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}