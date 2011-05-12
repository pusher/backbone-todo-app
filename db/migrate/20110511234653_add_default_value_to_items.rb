class AddDefaultValueToItems < ActiveRecord::Migration
  def self.up
    change_column :items, :isdone, :boolean, {:default => false, :null => false}
  end

  def self.down
  end
end
