package com.tutorly.app.backend_api.gui;

import javax.swing.*;
import java.awt.*;
import java.io.*;
import java.util.Properties;

/**
 * Tutorly API Server Manager GUI
 * 
 * A Swing-based graphical user interface for managing the Tutorly API server.
 * Provides functionality to:
 * - Configure database connection parameters
 * - Start and stop the Spring Boot server
 * - View real-time server logs
 * - Save and load configuration settings
 * 
 * @author Tutorly Team
 * @version 1.0
 */
public class ServerLauncherGUI extends JFrame {
    
    // Configuration file for storing last used settings
    private static final String CONFIG_FILE = "launcher-config.properties";
    
    // Spring Boot application.properties file location
    private File appPropertiesFile;
    
    // Project root directory
    private File projectRoot;
    
    // Database configuration input fields
    private JTextField hostField;
    private JTextField portField;
    private JTextField databaseField;
    private JTextField usernameField;
    private JPasswordField passwordField;
    
    // Control buttons
    private JButton toggleServerButton; // Start/Stop server toggle
    private JButton saveButton; // Save configuration
    
    // Console output area for server logs
    private JTextArea consoleArea;
    
    // Server process management
    private Process serverProcess; // The running Maven/Spring Boot process
    private Thread outputThread; // Thread for reading server output
    
    /**
     * Constructor - Initializes the GUI window and components
     */
    public ServerLauncherGUI() {
        setTitle("Tutorly API Server Manager");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1000, 900);
        setLocationRelativeTo(null);
        
        // Find project root and application.properties
        findProjectRoot();
        
        initComponents();
        loadLastConfiguration();
        
        setVisible(true);
    }
    
    /**
     * Finds the project root directory by searching for application.properties file.
     * Starts from the class file location and traverses up the directory tree.
     * Falls back to current working directory if not found from class location.
     */
    private void findProjectRoot() {
        // Get the location of the class file
        String classPath = ServerLauncherGUI.class.getProtectionDomain().getCodeSource().getLocation().getPath();
        File classLocation = new File(classPath);
        
        // Start from class location and go up to find project root
        File currentDir = classLocation;
        while (currentDir != null) {
            File appProps = new File(currentDir, "src/main/resources/application.properties");
            if (appProps.exists()) {
                projectRoot = currentDir;
                appPropertiesFile = appProps;
                return;
            }
            currentDir = currentDir.getParentFile();
        }
        
        // Fallback: try current working directory
        currentDir = new File(System.getProperty("user.dir"));
        File appProps = new File(currentDir, "src/main/resources/application.properties");
        if (appProps.exists()) {
            projectRoot = currentDir;
            appPropertiesFile = appProps;
            return;
        }
        
        // If still not found, set to current directory and let it fail with a clear message
        projectRoot = currentDir;
        appPropertiesFile = new File(currentDir, "src/main/resources/application.properties");
    }
    
    /**
     * Initializes all GUI components including:
     * - Database configuration panel with input fields
     * - Control buttons (Save and Start/Stop)
     * - Console panel for server logs
     */
    private void initComponents() {
        JPanel mainPanel = new JPanel(new BorderLayout(10, 10));
        mainPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        // Configuration panel
        JPanel configPanel = new JPanel(new GridBagLayout());
        configPanel.setBorder(BorderFactory.createTitledBorder("Database Configuration"));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 5, 5, 5);
        gbc.fill = GridBagConstraints.HORIZONTAL;
        
        // Database configuration fields with labels
        int row = 0;
        
        // Database host field
        gbc.gridx = 0; gbc.gridy = row; gbc.weightx = 0;
        configPanel.add(new JLabel("Host:"), gbc);
        gbc.gridx = 1; gbc.weightx = 1;
        hostField = new JTextField("localhost", 20);
        configPanel.add(hostField, gbc);
        
        // Database port field
        row++;
        gbc.gridx = 0; gbc.gridy = row; gbc.weightx = 0;
        configPanel.add(new JLabel("Port:"), gbc);
        gbc.gridx = 1; gbc.weightx = 1;
        portField = new JTextField("5432", 20);
        configPanel.add(portField, gbc);
        
        // Database name field
        row++;
        gbc.gridx = 0; gbc.gridy = row; gbc.weightx = 0;
        configPanel.add(new JLabel("Database Name:"), gbc);
        gbc.gridx = 1; gbc.weightx = 1;
        databaseField = new JTextField("tutorly_db", 20);
        configPanel.add(databaseField, gbc);
        
        // Database username field
        row++;
        gbc.gridx = 0; gbc.gridy = row; gbc.weightx = 0;
        configPanel.add(new JLabel("Username:"), gbc);
        gbc.gridx = 1; gbc.weightx = 1;
        usernameField = new JTextField("tutorly_admin", 20);
        configPanel.add(usernameField, gbc);
        
        // Database password field
        row++;
        gbc.gridx = 0; gbc.gridy = row; gbc.weightx = 0;
        configPanel.add(new JLabel("Password:"), gbc);
        gbc.gridx = 1; gbc.weightx = 1;
        passwordField = new JPasswordField(20);
        configPanel.add(passwordField, gbc);
        
        // Buttons panel with Save and Start/Stop controls
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 10));
        
        // Save configuration button
        saveButton = new JButton("Save Configuration");
        saveButton.setFont(new Font(saveButton.getFont().getName(), Font.PLAIN, 15));
        saveButton.setPreferredSize(new Dimension(200, 50));
        saveButton.addActionListener(e -> saveConfiguration());
        
        // Toggle server button (Start/Stop) - Green when stopped, Red when running
        toggleServerButton = new JButton("▶ Start Server");
        toggleServerButton.setFont(new Font(toggleServerButton.getFont().getName(), Font.BOLD, 18));
        toggleServerButton.setBackground(new Color(76, 175, 80)); // Green for start
        toggleServerButton.setForeground(Color.WHITE);
        toggleServerButton.setFocusPainted(false);
        toggleServerButton.setOpaque(true);
        toggleServerButton.setBorderPainted(false);
        toggleServerButton.setPreferredSize(new Dimension(240, 55));
        toggleServerButton.addActionListener(e -> toggleServer());
        
        buttonPanel.add(saveButton);
        buttonPanel.add(toggleServerButton);
        
        // Console panel for displaying server logs
        JPanel consolePanel = new JPanel(new BorderLayout());
        consolePanel.setBorder(BorderFactory.createTitledBorder("Server Logs"));
        
        // Text area with scroll pane for logs
        consoleArea = new JTextArea(15, 50);
        consoleArea.setEditable(false);
        consoleArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        JScrollPane scrollPane = new JScrollPane(consoleArea);
        scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);
        
        consolePanel.add(scrollPane, BorderLayout.CENTER);
        
        // Clear logs button
        JButton clearButton = new JButton("Clear Logs");
        clearButton.setFont(new Font(clearButton.getFont().getName(), Font.PLAIN, 13));
        clearButton.addActionListener(e -> consoleArea.setText(""));
        JPanel clearPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        clearPanel.add(clearButton);
        consolePanel.add(clearPanel, BorderLayout.SOUTH);
        
        // Add all panels to main panel
        mainPanel.add(configPanel, BorderLayout.NORTH);
        mainPanel.add(buttonPanel, BorderLayout.CENTER);
        mainPanel.add(consolePanel, BorderLayout.SOUTH);
        
        add(mainPanel);
    }
    
    /**
     * Loads the last saved configuration from launcher-config.properties file.
     * If the file exists, populates all database fields with saved values.
     * Otherwise, uses default values.
     */
    private void loadLastConfiguration() {
        try {
            Properties props = new Properties();
            File configFile = new File(CONFIG_FILE);
            
            if (configFile.exists()) {
                try (FileInputStream fis = new FileInputStream(configFile)) {
                    props.load(fis);
                    
                    hostField.setText(props.getProperty("db.host", "localhost"));
                    portField.setText(props.getProperty("db.port", "5432"));
                    databaseField.setText(props.getProperty("db.name", "tutorly_db"));
                    usernameField.setText(props.getProperty("db.username", "tutorly_admin"));
                    passwordField.setText(props.getProperty("db.password", ""));
                    
                    appendToConsole("Configuration loaded from " + CONFIG_FILE);
                }
            } else {
                appendToConsole("No previous configuration found. Using default values.");
            }
        } catch (IOException e) {
            appendToConsole("Error loading configuration: " + e.getMessage());
        }
    }
    
    /**
     * Saves the current configuration to launcher-config.properties file.
     * Stores all database connection parameters for future use.
     */
    private void saveConfiguration() {
        try {
            Properties props = new Properties();
            
            props.setProperty("db.host", hostField.getText());
            props.setProperty("db.port", portField.getText());
            props.setProperty("db.name", databaseField.getText());
            props.setProperty("db.username", usernameField.getText());
            props.setProperty("db.password", new String(passwordField.getPassword()));
            
            try (FileOutputStream fos = new FileOutputStream(CONFIG_FILE)) {
                props.store(fos, "Tutorly API Server Configuration");
            }
            
            appendToConsole("Configuration saved successfully!");
            JOptionPane.showMessageDialog(this, "Configuration saved!", "Success", JOptionPane.INFORMATION_MESSAGE);
        } catch (IOException e) {
            appendToConsole("Error saving configuration: " + e.getMessage());
            JOptionPane.showMessageDialog(this, "Error saving configuration: " + e.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }
    
    /**
     * Updates the Spring Boot application.properties file with current database settings.
     * Modifies the datasource URL, username, and password.
     * 
     * @throws IOException if application.properties file cannot be found or updated
     */
    private void updateApplicationProperties() throws IOException {
        if (!appPropertiesFile.exists()) {
            throw new IOException("File application.properties not found: " + appPropertiesFile.getAbsolutePath() + 
                "\nCurrent directory: " + System.getProperty("user.dir"));
        }
        
        Properties props = new Properties();
        try (FileInputStream fis = new FileInputStream(appPropertiesFile)) {
            props.load(fis);
        }
        
        // Update database properties
        String dbUrl = String.format("jdbc:postgresql://%s:%s/%s",
                hostField.getText(),
                portField.getText(),
                databaseField.getText());
        
        props.setProperty("spring.datasource.url", dbUrl);
        props.setProperty("spring.datasource.username", usernameField.getText());
        props.setProperty("spring.datasource.password", new String(passwordField.getPassword()));
        
        try (FileOutputStream fos = new FileOutputStream(appPropertiesFile)) {
            props.store(fos, "Updated by Server Launcher GUI");
        }
    }
    
    /**
     * Toggles the server state between running and stopped.
     * Calls startServer() if stopped, stopServer() if running.
     */
    private void toggleServer() {
        if (serverProcess != null && serverProcess.isAlive()) {
            stopServer();
        } else {
            startServer();
        }
    }
    
    /**
     * Starts the Spring Boot server using Maven wrapper (mvnw).
     * - Saves current configuration
     * - Updates application.properties
     * - Executes 'mvnw spring-boot:run' command
     * - Captures and displays server output in console
     * - Changes button to red "Stop Server"
     */
    private void startServer() {
        try {
            appendToConsole("=== Starting server ===");
            appendToConsole("Updating application.properties...");
            
            // Save configuration first
            saveConfiguration();
            
            // Update application.properties
            updateApplicationProperties();
            
            appendToConsole("Starting Spring Boot...");
            
            // Build Maven command
            String mvnCommand = System.getProperty("os.name").toLowerCase().contains("windows") 
                    ? "mvnw.cmd" : "./mvnw";
            
            ProcessBuilder pb = new ProcessBuilder(mvnCommand, "spring-boot:run");
            pb.directory(projectRoot);
            pb.redirectErrorStream(true);
            
            serverProcess = pb.start();
            
            // Start thread to read output
            outputThread = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(serverProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        final String output = line;
                        SwingUtilities.invokeLater(() -> appendToConsole(output));
                    }
                } catch (IOException e) {
                    SwingUtilities.invokeLater(() -> 
                        appendToConsole("Error reading output: " + e.getMessage()));
                }
            });
            outputThread.start();
            
            // Update button state - Rosso per fermare
            toggleServerButton.setText("⏹ Stop Server");
            toggleServerButton.setBackground(new Color(244, 67, 54)); // Rosso per fermare
            toggleServerButton.repaint();
            saveButton.setEnabled(false);
            disableConfigFields();
            
            appendToConsole("Server started!");
            
        } catch (Exception e) {
            appendToConsole("Error starting server: " + e.getMessage());
            e.printStackTrace();
            JOptionPane.showMessageDialog(this, 
                "Error starting server:\n" + e.getMessage(), 
                "Error", 
                JOptionPane.ERROR_MESSAGE);
        }
    }
    
    /**
     * Stops the running Spring Boot server.
     * - Destroys the server process
     * - Waits for process to terminate
     * - Changes button back to green "Start Server"
     * - Re-enables configuration fields
     */
    private void stopServer() {
        if (serverProcess != null && serverProcess.isAlive()) {
            appendToConsole("=== Stopping server ===");
            serverProcess.destroy();
            
            try {
                serverProcess.waitFor();
                appendToConsole("Server stopped.");
            } catch (InterruptedException e) {
                appendToConsole("Error stopping server: " + e.getMessage());
            }
        }
        
        // Update button state - Verde per avviare
        toggleServerButton.setText("▶ Start Server");
        toggleServerButton.setBackground(new Color(76, 175, 80)); // Verde per avviare
        toggleServerButton.repaint();
        saveButton.setEnabled(true);
        enableConfigFields();
    }
    
    /**
     * Disables all database configuration input fields.
     * Called when server is running to prevent configuration changes.
     */
    private void disableConfigFields() {
        hostField.setEnabled(false);
        portField.setEnabled(false);
        databaseField.setEnabled(false);
        usernameField.setEnabled(false);
        passwordField.setEnabled(false);
    }
    
    /**
     * Enables all database configuration input fields.
     * Called when server is stopped to allow configuration changes.
     */
    private void enableConfigFields() {
        hostField.setEnabled(true);
        portField.setEnabled(true);
        databaseField.setEnabled(true);
        usernameField.setEnabled(true);
        passwordField.setEnabled(true);
    }
    
    /**
     * Appends a line of text to the console area.
     * Thread-safe method that uses SwingUtilities.invokeLater().
     * Automatically scrolls to the bottom after appending.
     * 
     * @param text the text to append to console
     */
    private void appendToConsole(String text) {
        SwingUtilities.invokeLater(() -> {
            consoleArea.append(text + "\n");
            consoleArea.setCaretPosition(consoleArea.getDocument().getLength());
        });
    }
    
    /**
     * Main method - Entry point for the application.
     * Sets system look and feel and launches the GUI on the Event Dispatch Thread.
     * 
     * @param args command line arguments (not used)
     */
    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        SwingUtilities.invokeLater(() -> new ServerLauncherGUI());
    }
}
