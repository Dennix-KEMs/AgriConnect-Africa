exports.calculateLearningScore = (stats) => {

    return (

        Number(stats.posts) * 20 +

        Number(stats.comments) * 5 +

        Number(stats.reactions) * 3 +

        Number(stats.Views)

    );

};

exports.getCommunityLevel = (score) => {

    if (score >= 1500) {

        return {
            level: "Master Farmer",
            badge: "🏆"
        };

    }

    if (score >= 700) {

        return {
            level: "Community Mentor",
            badge: "🌳"
        };

    }

    if (score >= 300) {

        return {
            level: "Knowledge Sharer",
            badge: "🌾"
        };

    }

    if (score >= 100) {

        return {
            level: "Active Farmer",
            badge: "🌿"
        };

    }

    return {

        level: "New Contributor",

        badge: "🌱"

    };

};