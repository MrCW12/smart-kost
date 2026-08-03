<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utility_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['electricity', 'water', 'internet', 'parking', 'garbage', 'other']);
            $table->string('name', 100);
            $table->string('unit', 20);
            $table->decimal('rate', 12, 2);
            $table->decimal('min_usage', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('property_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utility_settings');
    }
};
