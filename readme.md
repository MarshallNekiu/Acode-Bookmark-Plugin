# Bookmark

A simple plugin to navigate through text.
This is the first plugin I made, at time i learn the enviroment for that.</br>
This can be updated for my needs(or keep if i feel comfy with it), within my capabilities learned and that can learn, still any request for update are welcome.

## Behavior

The bookmark are saved in your Acode folder as *bookmark.json*. The bookmark are listed by *file id*, if you move or rename the file, the id changes and the old one remains, you need to remove manually.

- **Save/Load**: If *bookmark.json* doesn't exist, create it.
- **Save**: Save the *Bookmark list* for the current file. If the *file id* is not found, create it and push the *Bookmark List*.
- **Load**: Load the *Bookmark list* for the current file. If the *file id is* not found, create it and push an empty *Bookmark List* and clear the actual one.
- **Add**: Add the focused line to the *Bookmark List*.
- **Show**: Show the *Bookmark List*, selecting one jump to the bookmark.
- **Erase**: Show the *Bookmark List*, selecting one erase the bookmark.