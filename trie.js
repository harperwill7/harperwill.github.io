// app_api/trie.js

class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
        // Store the full trip objects (or their codes/IDs) that pass through this node.
        this.trips = []; 
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    // Inserts a trip into the Trie based on its name.
    insert(trip) {
        let current = this.root;
        // Use the trip name for building the Trie
        const name = trip.name.toLowerCase(); 

        for (let i = 0; i < name.length; i++) {
            const char = name[i];
            
            if (!current.children.has(char)) {
                current.children.set(char, new TrieNode());
            }

            current = current.children.get(char);

            // Add the trip to the list at EVERY node along the path.
            current.trips.push(trip); 
        }
        current.isEndOfWord = true;
    }

    // Searches for all trips matching the given prefix.
    search(prefix) {
        let current = this.root;
        const lowerPrefix = prefix.toLowerCase();

        for (let i = 0; i < lowerPrefix.length; i++) {
            const char = lowerPrefix[i];
            
            // If the prefix path is broken, there are no results.
            if (!current.children.has(char)) {
                return [];
            }
            current = current.children.get(char);
        }

        // Return the collected trips from the node reached by the prefix.
        return current.trips;
    }
}

// Instantiate and export the Trie structure to be loaded by the server.
const tripTrie = new Trie();

module.exports = tripTrie;