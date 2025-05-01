# Info Modal Implementation Pattern

This document outlines the steps to add a consistent Info Modal to different views within the application.

## Steps

1.  **Add Info Icon Button to View (`YourView.vue`):**

    - Add a `<button>` element near the view's title or relevant section.
    - Place an appropriate icon (e.g., `InformationCircleIcon` from `@heroicons/vue/24/outline`) inside the button.
    - Style the button subtly (e.g., using a container `div` with `bg-blue-900/30 border border-blue-400/50 rounded-lg p-1`).
    - Add an `@click` handler to call a function like `openInfoModal`.

2.  **Implement Modal State and Control in View (`YourView.vue`):**

    - Import the `InfoModal` component: `import InfoModal from '@/components/shared/InfoModal.vue';`
    - Import required icons (e.g., `InformationCircleIcon`).
    - Create a ref for modal visibility: `const showInfoModal = ref(false);`
    - Define functions to toggle visibility:

      ```typescript
      function openInfoModal() {
        showInfoModal.value = true;
      }

      function closeInfoModal() {
        showInfoModal.value = false;
      }
      ```

3.  **Add InfoModal Component Instance to View Template (`YourView.vue`):**

    - Place the `<InfoModal>` component in the template.
    - Bind the `show-modal` prop to the visibility ref (`:show-modal="showInfoModal"`).
    - Pass the specific `type` prop corresponding to the view/section (e.g., `:type="'us_rate_sheet'"`). This type determines the content displayed.
    - Listen for the `close` event to trigger the closing function (`@close="closeInfoModal"`).

    ```vue
    <InfoModal
      :show-modal="showInfoModal"
      :type="'your_view_type'"
      @close="closeInfoModal"
    />
    ```

4.  **Define Content in `InfoModal.vue`:**

    - Ensure a `case` exists in the `setContentByType` function within `InfoModal.vue` for the `type` you passed in step 3.
    - Define the appropriate `title.value` and `message.value` (using backticks `` ` `` for multi-line HTML) for that case.

5.  **Styling:**

    - The `InfoModal` component is already styled to match the `PreviewModal` aesthetic (dark theme, specific background, padding, footer, close button styles) for consistency.

6.  **Content & Tone:**

    - **Focus on Benefits:** Frame the description around _how_ the feature helps the user (e.g., "Unlock Effortless...", "streamlines your workflow", "saving you time").
    - **Highlight Key Features:** Clearly mention the core functionality and any powerful or unique aspects (e.g., "powerful rate adjustments", "targeting specific NPAs...").
    - **Engaging Language:** Use slightly more enthusiastic and positive language to make the feature feel valuable (e.g., "intuitive wizard", "unleash", "indispensable tool").
    - **Readability:** Use HTML formatting like `<br>`, `<ol>`, `<strong>`, and `<code>` within the backtick string to structure the message and improve readability.
    - **Reference:** See the `us_rate_sheet` case within `InfoModal.vue` for a good example of this tone and structure.
