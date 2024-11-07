export const buildPrompt = (cvPoint, targetDomain, jobDescription = '') => {
    let prompt = `
  Transform this CV point for a ${targetDomain} role. The original point comes from a sustainability background.
  
  Original CV Point: ${cvPoint}
  ${jobDescription ? `Target Job Description: ${jobDescription}\n` : ''}
  
  Requirements:
  1. Maintain authenticity of experience
  2. Highlight ${targetDomain}-relevant aspects
  3. Use domain-specific terminology
  4. Keep similar length to original
  5. Focus on quantifiable achievements
  6. Emphasize transferable skills
  
  Provide only the transformed CV point without any explanation or commentary.
  `;

    return prompt.trim();
};

export const parseResponse = (response) => {
    // Clean up any extra formatting or commentary from the response
    return response.trim();
};

export const getSystemPrompt = () => {
    return `You are an expert CV translator specializing in adapting sustainability experience for various business domains. Your role is to help sustainability professionals translate their experience to align with specific job requirements while maintaining authenticity. You excel at identifying transferable skills and expressing them using domain-appropriate terminology.

    Your strengths include:

    Understanding both sustainability and business domain terminology
    Identifying transferable skills and experiences
    Maintaining authenticity while highlighting relevant aspects
    Aligning experiences with job requirements
    Using industry-standard terminology

    Follow these key principles:

    Preserve all quantitative achievements and impact metrics
    Maintain the original scope and responsibility level
    Use active voice and strong action verbs
    Focus on transferable skills
    Align with provided job requirements when available
    Keep similar length to original point
    Highlight key achievements
    End with impact or outcome
    

    Domain-Specific Guidelines:

    Marketing: Emphasize market research, customer insights, campaign impact, brand development, strategic communication
    Sales: Focus on revenue generation, relationship building, deal closure, client engagement, market expansion
    Consulting: Highlight problem-solving, analysis, recommendations, project management, stakeholder management
    Product Management: Stress user research, product development, cross-functional leadership, roadmap planning, feature prioritization
    Finance: Emphasize financial analysis, risk management, budgeting, cost optimization, investment assessment
    `;
};

// Helper function to construct user prompt
export const getUserPrompt = (cvPoint, targetDomain, jobDescription) => {
    return `Transform the following CV point for a ${targetDomain} role.
    CV Point: ${cvPoint}
    Target Job Requirements:
    ${jobDescription}
    
    Please:
    Identify relevant skills/experiences from the CV point that match the job requirements
    Translate using {targetDomain} terminology while preserving authenticity
    Highlight quantitative achievements
    Add domain-specific metrics when relevant

    Respond in the following JSON format:
    {
        "translatedPoint": "string",  // The translated CV point
        "domainAlignment": [        // list of domain-relevant elements highlighted
            "string"
        ]
        "preservedElements": [        // List of key elements maintained from original
            "string"
        ]
    }
    Example Input:
    CV Point: "Led sustainability audit for 15 manufacturing plants, reducing carbon emissions by 25% through implementation of renewable energy solutions and waste reduction initiatives, saving $2M annually"
    Job Description: "Looking for a Product Manager with experience in large-scale project management, cross-functional leadership, and proven track record of delivering measurable impact. Must have experience in data analysis and stakeholder management."
    Example Output:
    {
        "translatedPoint": "Led cross-functional teams across 15 sites to deliver high-impact sustainability product initiatives, analyzing operational data to drive 25% efficiency improvements and $2M cost savings through innovative solution implementation",
        "domainAlignment": ["Led cross-functional teams", "analyzing data to drive improvements"],
        "preservedElements": [
        "15 sites scope",
        "25% improvement metric",
        "$2M cost savings"
        ]
    }`
};