"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function TestConfirmDialogPage() {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    type: "danger" as "danger" | "warning" | "info",
  });

  const [result, setResult] = useState<string>("");

  const showDialog = (
    title: string,
    message: string,
    confirmText: string = "Confirm",
    type: "danger" | "warning" | "info" = "danger",
  ) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      confirmText,
      type,
    });
    setResult("");
  };

  const handleConfirm = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    setResult("✅ User confirmed the action!");
  };

  const handleCancel = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    setResult("❌ User cancelled the action.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Confirm Dialog Test Page
          </h1>
          <p className="text-gray-400">
            Test the beautiful confirm dialog component with different types and messages
          </p>
        </header>

        {/* Result Display */}
        {result && (
          <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-lg text-white">{result}</p>
          </div>
        )}

        {/* Test Buttons Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Delete Single Photo */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-3 text-xl font-semibold text-white">
              Delete Single Photo
            </h3>
            <p className="mb-4 text-sm text-gray-400">
              Simulate deleting a single photo with danger styling
            </p>
            <button
              onClick={() =>
                showDialog(
                  "Delete Photo?",
                  "You are about to permanently delete this photo. This action cannot be undone.",
                  "Delete Photo",
                  "danger",
                )
              }
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700"
            >
              Delete Photo
            </button>
          </div>

          {/* Delete Multiple Photos */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-3 text-xl font-semibold text-white">
              Delete Multiple Photos
            </h3>
            <p className="mb-4 text-sm text-gray-400">
              Simulate batch deletion with count information
            </p>
            <button
              onClick={() =>
                showDialog(
                  "Delete Selected Photos?",
                  "You are about to permanently delete 5 selected photos. This action cannot be undone.",
                  "Delete 5 Photos",
                  "danger",
                )
              }
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>

          {/* Delete All Photos */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-3 text-xl font-semibold text-white">
              Delete All Photos
            </h3>
            <p className="mb-4 text-sm text-gray-400">
              Simulate deleting all photos in a section
            </p>
            <button
              onClick={() =>
                showDialog(
                  "Delete All Start Photos?",
                  "You are about to permanently delete 23 start photos. This action cannot be undone.",
                  "Delete All",
                  "danger",
                )
              }
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700"
            >
              Delete All
            </button>
          </div>

          {/* Warning Example */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-3 text-xl font-semibold text-white">
              Warning Dialog
            </h3>
            <p className="mb-4 text-sm text-gray-400">
              Example warning dialog with yellow styling
            </p>
            <button
              onClick={() =>
                showDialog(
                  "Upload Warning",
                  "Your photo quality is below recommended standards. Continue anyway?",
                  "Upload Anyway",
                  "warning",
                )
              }
              className="w-full rounded-lg bg-yellow-600 px-4 py-3 font-medium text-white transition-colors hover:bg-yellow-700"
            >
              Show Warning
            </button>
          </div>

          {/* Info Example */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-3 text-xl font-semibold text-white">
              Info Dialog
            </h3>
            <p className="mb-4 text-sm text-gray-400">
              Example info dialog with blue styling
            </p>
            <button
              onClick={() =>
                showDialog(
                  "Processing Complete",
                  "Your photos have been successfully processed. Would you like to view the results now?",
                  "View Results",
                  "info",
                )
              }
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Show Info
            </button>
          </div>

          {/* Long Message Example */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-3 text-xl font-semibold text-white">
              Long Message
            </h3>
            <p className="mb-4 text-sm text-gray-400">
              Test with a longer, more detailed message
            </p>
            <button
              onClick={() =>
                showDialog(
                  "Account Deletion",
                  "You are about to permanently delete your account and all associated data. This includes all your photos, generation history, and preferences. This action is irreversible and cannot be undone. Are you absolutely sure you want to proceed?",
                  "Delete Account",
                  "danger",
                )
              }
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700"
            >
              Long Message
            </button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-xl font-semibold text-white">
            Usage Instructions
          </h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>• Click any button above to test the confirm dialog</p>
            <p>• Press <kbd className="rounded bg-gray-800 px-2 py-1 text-gray-300">Enter</kbd> to confirm</p>
            <p>• Press <kbd className="rounded bg-gray-800 px-2 py-1 text-gray-300">Escape</kbd> to cancel</p>
            <p>• Click the backdrop to cancel</p>
            <p>• The result of your choice will be displayed at the top</p>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText="Cancel"
        type={dialogState.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
