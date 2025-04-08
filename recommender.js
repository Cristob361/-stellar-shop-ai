// Updated product database for clothing
const products = [
    { id: 1, name: "Classic Denim Jacket", category: "Outerwear", price: 89.99, style: "Casual", color: "Blue", season: "All-Season" },
    { id: 2, name: "Cotton T-Shirt", category: "Tops", price: 24.99, style: "Basic", color: "White", season: "Summer" },
    { id: 3, name: "Slim Fit Jeans", category: "Bottoms", price: 69.99, style: "Casual", color: "Dark Blue", season: "All-Season" },
    { id: 4, name: "Leather Sneakers", category: "Footwear", price: 119.99, style: "Sporty", color: "Black", season: "All-Season" },
    { id: 5, name: "Wool Sweater", category: "Tops", price: 79.99, style: "Casual", color: "Gray", season: "Winter" },
    { id: 6, name: "Formal Blazer", category: "Outerwear", price: 149.99, style: "Formal", color: "Black", season: "All-Season" },
    { id: 7, name: "Summer Dress", category: "Dresses", price: 59.99, style: "Casual", color: "Floral", season: "Summer" },
    { id: 8, name: "Athletic Shorts", category: "Bottoms", price: 34.99, style: "Sporty", color: "Navy", season: "Summer" }
];

// Sample user purchase history
const userHistory = {
    "demo1": [1, 3, 5],
    "demo2": [2, 4, 7],
    "demo3": [6, 8, 1],
    "user123": [1, 3],
    "user456": [2, 4],
    "user789": [1, 2, 5]
};

// Add feedback storage
const userFeedback = JSON.parse(localStorage.getItem('userFeedback')) || {};

// Add style-based similarity scoring
function calculateSimilarityScore(product, userPreferences) {
    if (!userPreferences.length) return 0.5;
    
    const userProducts = userPreferences.map(id => products.find(p => p.id === id));
    const styleMatch = userProducts.some(p => p.style === product.style);
    const categoryMatch = userProducts.some(p => p.category === product.category);
    const seasonMatch = userProducts.some(p => p.season === product.season);
    
    return (styleMatch ? 0.5 : 0) + (categoryMatch ? 0.3 : 0) + (seasonMatch ? 0.2 : 0);
}

// Add data analysis functions
const dataAnalysis = {
    getPurchasePatterns(userId) {
        const purchases = userHistory[userId] || [];
        const purchasedProducts = purchases.map(id => products.find(p => p.id === id));
        
        return {
            favoriteCategory: this.getMostFrequent(purchasedProducts.map(p => p.category)),
            favoriteStyle: this.getMostFrequent(purchasedProducts.map(p => p.style)),
            averageSpent: this.calculateAverage(purchasedProducts.map(p => p.price)),
            seasonalPreference: this.getMostFrequent(purchasedProducts.map(p => p.season)),
            priceRange: this.getPriceRange(purchasedProducts.map(p => p.price))
        };
    },

    getMostFrequent(arr) {
        if (!arr.length) return 'No data';
        return arr.sort((a,b) =>
            arr.filter(v => v === a).length - arr.filter(v => v === b).length
        ).pop();
    },

    calculateAverage(numbers) {
        if (!numbers.length) return 0;
        return (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(2);
    },

    getPriceRange(prices) {
        if (!prices.length) return { min: 0, max: 0 };
        return {
            min: Math.min(...prices),
            max: Math.max(...prices)
        };
    },

    getStyleAffinityScore(product, userPatterns) {
        let score = 0;
        if (product.category === userPatterns.favoriteCategory) score += 0.4;
        if (product.style === userPatterns.favoriteStyle) score += 0.3;
        if (product.season === userPatterns.seasonalPreference) score += 0.2;
        if (product.price <= userPatterns.priceRange.max) score += 0.1;
        return score;
    }
};

// Add public access controls
const demoUserIds = ['demo1', 'demo2', 'demo3']; // Demo users for public access

// Add demo mode detection
function isDemo(userId) {
    return demoUserIds.includes(userId);
}

function getRecommendations() {
    const userId = document.getElementById('userId').value.toLowerCase();
    const recommendationList = document.getElementById('recommendationList');
    const warnings = document.getElementById('warnings');
    const context = document.getElementById('context');
    const debugData = document.getElementById('debugData');
    
    // Clear previous results
    recommendationList.innerHTML = '';
    warnings.innerHTML = '';
    context.innerHTML = '';
    debugData.innerHTML = '';

    if (!userId) {
        showNotification('Please enter a User ID or try a demo account (demo1, demo2, demo3)');
        return;
    }

    const userPurchases = userHistory[userId] || [];
    
    // Enhanced recommendation logic with ranking
    const userPatterns = dataAnalysis.getPurchasePatterns(userId);
    
    let recommendations = products
        .filter(product => !userPurchases.includes(product.id))
        .map(product => ({
            ...product,
            similarityScore: dataAnalysis.getStyleAffinityScore(product, userPatterns)
        }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 5); // Top 5 recommendations

    // Generate alerts
    const alerts = [];
    if (userPurchases.length < 2) {
        alerts.push("⚠️ Low purchase history — recommendations may be inaccurate.");
    }
    if (products.length < 10) {
        alerts.push("⚠️ Limited product catalog — consider enriching inventory.");
    }
    if (alerts.length === 0) {
        alerts.push("✅ Data quality is acceptable for recommendation engine.");
    }

    displayResults({
        recommendations,
        warnings: alerts,
        context: {
            purchaseCount: userPurchases.length,
            lastPurchases: userPurchases.map(id => 
                products.find(p => p.id === id)?.category
            ).filter(Boolean),
            patterns: userPatterns
        },
        debug_data: {
            totalProducts: products.length,
            similarityScoreAvg: recommendations.reduce((acc, rec) => 
                acc + rec.similarityScore, 0) / recommendations.length,
            styleAnalysis: userPatterns
        }
    });
}

function handleFeedback(productId, isPositive) {
    const userId = document.getElementById('userId').value;
    if (!userFeedback[userId]) {
        userFeedback[userId] = {};
    }
    
    const feedbackKey = `${userId}_${productId}`;
    userFeedback[userId][productId] = isPositive;
    localStorage.setItem('userFeedback', JSON.stringify(userFeedback));
    
    const productName = products.find(p => p.id === productId)?.name;
    updateFeedbackDisplay(productId, isPositive, productName);
}

function updateFeedbackDisplay(productId, isPositive, productName) {
    const feedbackElement = document.querySelector(`#feedback-${productId}`);
    if (feedbackElement) {
        feedbackElement.innerHTML = `You ${isPositive ? 'liked' : 'disliked'} ${productName}!`;
        feedbackElement.className = `feedback-message ${isPositive ? 'positive' : 'negative'}`;
    }
}

function displayResults(data) {
    document.getElementById('recommendationList').innerHTML = formatRecommendations(data.recommendations);
    document.getElementById('warnings').innerHTML = formatWarnings(data.warnings);
    document.getElementById('context').innerHTML = formatContext(data.context);
    document.getElementById('debugData').innerHTML = formatDebugData(data.debug_data);
}

function formatRecommendations(recommendations) {
    return recommendations.map((rec, index) => `
        <div class="product" id="product-${rec.id}">
            <div class="rank-badge">${index + 1}</div>
            <h3>${rec.name}</h3>
            <div class="product-details">
                <p>Category: ${rec.category}</p>
                <p>Style: ${rec.style}</p>
                <p>Color: ${rec.color}</p>
                <p>Season: ${rec.season}</p>
                <p class="price">$${rec.price.toFixed(2)}</p>
            </div>
            <div class="feedback-buttons">
                <button onclick="handleFeedback(${rec.id}, true)" class="like-btn">👍 Like</button>
                <button onclick="handleFeedback(${rec.id}, false)" class="dislike-btn">👎 Dislike</button>
            </div>
            <div id="feedback-${rec.id}" class="feedback-message"></div>
            <div class="tooltip">
                <span class="tooltip-text">Matches your style preferences</span>
            </div>
        </div>
    `).join('');
}

// Helper functions for formatting other sections
function formatWarnings(warnings) {
    return warnings.join('<br>');
}

function formatContext(context) {
    const { patterns } = context;
    return `
        <div class="context-wrapper">
            <div class="public-notice">
                <p>✨ Try different demo users to see how recommendations change!</p>
                <p>Available demos: demo1, demo2, demo3</p>
            </div>
            ${isDemo(document.getElementById('userId').value) ? 
                `<div class="demo-badge">Demo Account</div>` : ''}
            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>Shopping History</h4>
                    <p>📦 ${context.purchaseCount} purchases</p>
                    <p>💰 Avg: $${patterns.averageSpent}</p>
                </div>
                <div class="metric-card">
                    <h4>Style Profile</h4>
                    <p>👔 ${patterns.favoriteStyle}</p>
                    <p>🌤️ ${patterns.seasonalPreference}</p>
                </div>
            </div>
            <div class="category-analysis">
                <h4>Category Preferences</h4>
                <div class="category-stats">
                    ${formatCategoryStats(context)}
                </div>
            </div>
            ${isAdmin ? `
                <details class="debug-details">
                    <summary>Debug Data</summary>
                    <pre>${JSON.stringify(context, null, 2)}</pre>
                </details>
            ` : ''}
        </div>
    `;
}

function formatDebugData(debugData) {
    const matchScore = (debugData.similarityScoreAvg * 100).toFixed(1);
    const { styleAnalysis } = debugData;
    
    return `
        <div class="analytics-wrapper">
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h4>Match Quality</h4>
                    <div class="circle-progress" data-value="${matchScore}">
                        <span>${matchScore}%</span>
                    </div>
                </div>
                <div class="analytics-card">
                    <h4>Price Range</h4>
                    <p>$${styleAnalysis.priceRange.min} - $${styleAnalysis.priceRange.max}</p>
                </div>
            </div>
            ${isAdmin ? `
                <details class="debug-details">
                    <summary>Technical Details</summary>
                    <pre>${JSON.stringify(debugData, null, 2)}</pre>
                </details>
            ` : ''}
        </div>
    `;
}

function formatCategoryStats(context) {
    const categories = {};
    context.lastPurchases.forEach(cat => {
        categories[cat] = (categories[cat] || 0) + 1;
    });

    return Object.entries(categories)
        .map(([category, count]) => `
            <div class="stat-bar">
                <span class="stat-label">${category}</span>
                <div class="stat-value" style="width: ${(count/context.purchaseCount)*100}%">
                    ${count}
                </div>
            </div>
        `).join('');
}

function generateStyleTags(categories) {
    const styleMap = {
        'Outerwear': ['Trendy', 'Layered'],
        'Tops': ['Versatile', 'Essential'],
        'Bottoms': ['Comfortable', 'Fitted'],
        'Footwear': ['Active', 'Practical'],
        'Dresses': ['Elegant', 'Seasonal']
    };

    const styles = categories
        .flatMap(cat => styleMap[cat] || [])
        .filter((v, i, a) => a.indexOf(v) === i);

    return styles
        .map(style => `<span class="style-tag">${style}</span>`)
        .join('');
}

// Add user guidance
function showNotification(message) {
    const warnings = document.getElementById('warnings');
    warnings.innerHTML = `<div class="notification">${message}</div>`;
}

// Add this at the top of your file
const isAdmin = false; // Toggle for debug mode
