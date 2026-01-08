#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

// Length of the generated API key
#define KEY_LENGTH 32
// Maximum length of a line in the properties file
#define MAX_LINE_LENGTH 1024
// Relative path to the application.properties file
#define PROPERTIES_FILE "../Java/backend-api/src/main/resources/application.properties"

// Character set used for generating random API keys
// Character set used for generating random API keys
const char charset[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789";

/**
 * Generates a random API key using /dev/urandom
 * @param key Buffer to store the generated key
 * @param length Length of the key to generate
 */
void generate_api_key(char *key, size_t length) {
    // Open /dev/urandom for cryptographically secure random bytes
    int fd = open("/dev/urandom", O_RDONLY);
    if (fd < 0) {
        perror("Error while opening /dev/urandom");
        exit(1);
    }

    // Read random bytes
    unsigned char buffer[length];
    read(fd, buffer, length);
    close(fd);

    // Convert random bytes to characters from charset
    for (size_t i = 0; i < length; i++) {
        key[i] = charset[buffer[i] % (sizeof(charset) - 1)];
    }
    key[length] = '\0';
}

/**
 * Adds the generated API key to the application.properties file
 * @param api_key The API key to add
 * @return 0 on success, 1 on failure
 */
int add_key_to_properties(const char *api_key) {
    // Open the properties file for reading
    FILE *file = fopen(PROPERTIES_FILE, "r");
    if (file == NULL) {
        perror("Error opening application.properties for reading");
        return 1;
    }

    // Read all file content into memory
    char **lines = NULL;
    size_t num_lines = 0;
    size_t capacity = 10;
    lines = malloc(capacity * sizeof(char *));
    
    char line[MAX_LINE_LENGTH];
    int key_line_index = -1;  // Index of the line containing api.security.keys
    
    // Read file line by line
    while (fgets(line, sizeof(line), file)) {
        // Expand array if needed
        if (num_lines >= capacity) {
            capacity *= 2;
            lines = realloc(lines, capacity * sizeof(char *));
        }
        
        // Remove newline character if present
        size_t len = strlen(line);
        if (len > 0 && line[len - 1] == '\n') {
            line[len - 1] = '\0';
        }
        
        // Check if this is the API keys line
        if (strncmp(line, "api.security.keys=", 18) == 0) {
            key_line_index = num_lines;
        }
        
        // Store the line
        lines[num_lines] = strdup(line);
        num_lines++;
    }
    fclose(file);

    // If API keys line was not found, add a new line
    if (key_line_index == -1) {
        fprintf(stderr, "Warning: api.security.keys line not found, adding new line\n");
        if (num_lines >= capacity) {
            capacity *= 2;
            lines = realloc(lines, capacity * sizeof(char *));
        }
        char new_line[MAX_LINE_LENGTH];
        snprintf(new_line, sizeof(new_line), "api.security.keys=%s", api_key);
        lines[num_lines] = strdup(new_line);
        num_lines++;
    } else {
        // Append the new key to the existing line (comma-separated)
        char *old_line = lines[key_line_index];
        char new_line[MAX_LINE_LENGTH];
        snprintf(new_line, sizeof(new_line), "%s,%s", old_line, api_key);
        free(old_line);
        lines[key_line_index] = strdup(new_line);
    }

    // Write the modified content back to the file
    file = fopen(PROPERTIES_FILE, "w");
    if (file == NULL) {
        perror("Error opening application.properties for writing");
        // Free allocated memory before returning
        for (size_t i = 0; i < num_lines; i++) {
            free(lines[i]);
        }
        free(lines);
        return 1;
    }

    // Write all lines back to the file
    for (size_t i = 0; i < num_lines; i++) {
        fprintf(file, "%s\n", lines[i]);
        free(lines[i]);
    }
    fclose(file);
    free(lines);

    return 0;
}

/**
 * Main function: generates an API key and adds it to application.properties
 */
int main() {
    char api_key[KEY_LENGTH + 1];

    // Generate a random API key
    generate_api_key(api_key, KEY_LENGTH);
    printf("Generated API Key: %s\n", api_key);

    // Add the key to the properties file
    if (add_key_to_properties(api_key) == 0) {
        printf("API Key successfully added to application.properties\n");
    } else {
        fprintf(stderr, "Failed to add API Key to application.properties\n");
        return 1;
    }

    return 0;
}
