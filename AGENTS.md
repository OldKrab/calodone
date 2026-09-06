# CalDone project rules

## App-owned dialogs

- Never use `Alert.alert`, stock Android action dialogs, or other default platform UI for app-owned menus, confirmations, notices, and errors.
- Use `AnchoredMenu` for three-dot/header overflow menus. The menu opens beside its trigger and does not dim the screen.
- Use `AppDialog` for confirmations, notices, errors, and bottom actions that do not have an anchored trigger.
- OS-owned permission, authentication, camera, photo-picker, and share UI is allowed.
