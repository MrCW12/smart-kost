<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('contract_number', 50)->unique();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('monthly_price', 12, 2);
            $table->decimal('deposit_amount', 12, 2)->default(0);
            $table->integer('payment_day')->default(1);
            $table->enum('status', ['active', 'expired', 'terminated', 'completed'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('room_id');
            $table->index('property_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
