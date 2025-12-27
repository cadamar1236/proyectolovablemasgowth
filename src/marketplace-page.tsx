import { createLayoutWithSidebars } from './layout-with-sidebars';

export function getMarketplacePage(userName: string, userAvatar?: string): string {
  const marketplaceContent = `
    <!-- Marketplace Content -->
    <div class="p-6">
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-black text-gray-900">Beta Validator Marketplace</h1>
        <p class="text-gray-600 mt-2">Connect with 500+ expert validators for real feedback</p>
      </div>

      <!-- Tabs -->
      <div class="border-b mb-6">
        <div class="flex space-x-6">
          <button onclick="showTab('products')" class="tab tab-active pb-3 px-2 font-bold transition border-b-2 border-primary text-primary" id="products-tab">
            <i class="fas fa-box-open mr-2"></i>Products
          </button>
          <button onclick="showTab('validators')" class="tab pb-3 px-2 text-gray-600 hover:text-primary transition border-b-2 border-transparent font-bold" id="validators-tab">
            <i class="fas fa-users mr-2"></i>Validators
          </button>
        </div>
      </div>

      <!-- Products Tab Content -->
      <div id="products-content" class="tab-content">
        <div class="mb-6">
          <button onclick="showCreateProductModal()" class="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-lg hover:shadow-lg transition hidden font-bold" id="create-product-btn">
            <i class="fas fa-plus mr-2"></i>Publish Product
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <h3 class="text-lg font-bold text-gray-900 mb-3">Filters</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select id="category-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                <option value="">All</option>
                <option value="SaaS">SaaS</option>
                <option value="Mobile">Mobile</option>
                <option value="Web3">Web3</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Fintech">Fintech</option>
                <option value="E-commerce">E-commerce</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Stage</label>
              <select id="stage-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                <option value="">All</option>
                <option value="mvp">MVP</option>
                <option value="beta">Beta</option>
                <option value="launched">Launched</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Sort By</label>
              <select id="sort-filter" onchange="loadProducts()" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="votes">Most Votes</option>
              </select>
            </div>
            <div class="flex items-end">
              <button onclick="resetProductFilters()" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold transition">
                <i class="fas fa-undo mr-2"></i>Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Products Grid -->
        <div id="products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="col-span-full text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p class="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>

      <!-- Validators Tab Content -->
      <div id="validators-content" class="tab-content hidden">
        <div class="mb-6">
          <input
            type="text"
            id="validator-search"
            placeholder="Search validators by skill, industry..."
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
            onkeyup="searchValidators()"
          />
        </div>

        <!-- Validators Grid -->
        <div id="validators-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="col-span-full text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p class="text-gray-600">Loading validators...</p>
          </div>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="/static/marketplace.js"></script>
    <script>
      // Tab switching
      function showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
          tab.classList.add('hidden');
        });

        // Remove active state from all tab buttons
        document.querySelectorAll('.tab').forEach(btn => {
          btn.classList.remove('tab-active', 'border-primary', 'text-primary');
          btn.classList.add('border-transparent', 'text-gray-600');
        });

        // Show selected tab
        document.getElementById(tabName + '-content').classList.remove('hidden');

        // Add active state to selected tab button
        const activeBtn = document.getElementById(tabName + '-tab');
        activeBtn.classList.add('tab-active', 'border-primary', 'text-primary');
        activeBtn.classList.remove('border-transparent', 'text-gray-600');

        // Load content if needed
        if (tabName === 'products') {
          loadProducts();
        } else if (tabName === 'validators') {
          loadValidators();
        }
      }

      // Load products on page load
      window.addEventListener('load', () => {
        loadProducts();
      });

      // Reset filters
      function resetProductFilters() {
        document.getElementById('category-filter').value = '';
        document.getElementById('stage-filter').value = '';
        document.getElementById('sort-filter').value = 'recent';
        loadProducts();
      }
    </script>
  `;

  return createLayoutWithSidebars({
    content: marketplaceContent,
    currentPage: 'marketplace',
    userName: userName,
    userAvatar: userAvatar,
    pageTitle: 'Marketplace'
  });
}
