export function generateFallbackResponse(
  query: string,
  colleges: any[],
): string {
  // CASE 1: No colleges found
  if (colleges.length === 0) {
    return `
      <div class="bg-red-50 border border-red-200 rounded-2xl p-6 mt-4 shadow-sm">
        
        <h2 class="text-lg font-semibold text-red-600 mb-2">
          No Colleges Found
        </h2>

        <p class="text-gray-700 leading-relaxed">
          We couldn't find colleges matching 
          <span class="font-semibold text-black">"${query}"</span>.
        </p>

        <p class="mt-3 text-sm text-gray-600">
          Try searching for cities like 
          <span class="font-medium text-indigo-600">Delhi</span> or 
          <span class="font-medium text-indigo-600">Noida</span>.
        </p>

      </div>
    `;
  }

  // CASE 2: Colleges found
  let response = `
    <div class="mt-6">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
        🎓 Top Results for "${query}"
      </h2>
  `;

  colleges.slice(0, 3).forEach((college) => {
    response += `
      <div class="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 mb-6">

        <h3 class="text-xl md:text-2xl font-semibold text-indigo-600 mb-3">
          ${college.name}
        </h3>

        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          <span>📍 ${college.location}</span>
          <span>⭐ ${college.rating}/5</span>
          <span class="font-medium text-green-600">💰 ${college.fees}</span>
        </div>

        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">
            📚 Top Courses
          </p>

          <div class="flex flex-wrap gap-2">
            ${college.courses
              .slice(0, 3)
              .map(
                (course: string) => `
                  <span class="bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1 rounded-full">
                    ${course}
                  </span>
                `,
              )
              .join("")}
          </div>
        </div>

        <p class="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
          🎯 ${college.highlights?.[0] || "Top-rated institution with strong academic reputation."}
        </p>

        <button class="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition duration-200">
          View Details
        </button>

      </div>
    `;
  });

  response += `
      <p class="text-xs text-gray-500 mt-4">
        Showing results from local database. AI service temporarily unavailable.
      </p>
    </div>
  `;

  return response;
}
