## Plan

1. **Fix the upload failure for good**
   - Clean up old/conflicting storage policies that still target the old `uploads/presentations` folder.
   - Recreate simple, correct rules for the real `presentations` bucket.
   - Keep the bucket public for viewing/downloading the deck.

2. **Make Admin → Presentation clearer and safer**
   - Show whether the admin is signed in before uploading.
   - Disable upload with a clear message if not signed in.
   - Add stronger upload status states: selected file, uploading, success, and detailed error text.
   - Add quick actions: preview/open deck, download deck, replace deck, clear deck.
   - Keep `.pptx` and `.pdf` support, but explain that browser inline preview works best for PDF.

3. **Make public Docs → Presentation more useful for users**
   - If the uploaded file is a PDF, show it directly in the viewer.
   - If it is PPTX, show a polished deck card with open/download actions instead of fake numbered slide previews.
   - Make slide count optional/supporting instead of pretending real PPTX slides are rendered in-browser.

4. **Persist deck info more reliably**
   - Keep metadata in local storage for the current app behavior.
   - Store only the public file URL and metadata, not the full PPTX content, so quota errors do not return.

## Technical notes

- The current app uploads to bucket `presentations`, but the database still contains older policies for bucket `uploads` with folder `presentations`; I will remove those to avoid conflicts and leave only the real bucket policies.
- No private keys will be exposed in browser code.
- I will only edit the admin/docs presentation flow and the storage policy migration.